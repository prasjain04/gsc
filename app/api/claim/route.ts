import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role to bypass RLS for partner operations
function createAdminSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set — partner claims will fail');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, recipeId, userId, course, partnerIds } = body;

    if (!eventId || !recipeId || !userId || !course) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminSupabase();
    const allUserIds = [userId, ...(partnerIds || [])];

    // 1. Delete old claims for the primary user and all partners
    for (const uid of allUserIds) {
      await supabase.from('claims').delete().eq('event_id', eventId).eq('user_id', uid);
    }

    // 2. Create claims for the primary user AND all partners (one at a time to handle constraints)
    for (const uid of allUserIds) {
      const { error: claimError } = await supabase.from('claims').insert({
        event_id: eventId,
        recipe_id: recipeId,
        user_id: uid,
        is_suggestion: false,
      });
      if (claimError) {
        console.error(`Claim insert failed for user ${uid}:`, claimError);
      }
    }

    // 3. Update/upsert RSVPs for primary user and all partners
    for (const uid of allUserIds) {
      // Determine this user's partner list (everyone else in the group)
      const thisUsersPartners = allUserIds.filter(id => id !== uid);

      const { data: existingRsvp } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', uid)
        .maybeSingle();

      if (existingRsvp) {
        await supabase
          .from('rsvps')
          .update({
            status: 'attending',
            course_preference: course,
            partner_ids: thisUsersPartners,
          })
          .eq('id', existingRsvp.id);
      } else {
        await supabase.from('rsvps').insert({
          event_id: eventId,
          user_id: uid,
          status: 'attending',
          course_preference: course,
          partner_ids: thisUsersPartners,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Claim API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, claimId } = body;

    if (!eventId || !claimId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    // Find the claim to get the user_id
    const { data: claimData } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (!claimData) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Find the user's partners from their RSVP
    const { data: rsvpData } = await supabase
      .from('rsvps')
      .select('partner_ids')
      .eq('event_id', eventId)
      .eq('user_id', claimData.user_id)
      .single();

    const partners = rsvpData?.partner_ids || [];
    const allUsers = [claimData.user_id, ...partners];

    // Delete claims for the primary user and all partners
    for (const uid of allUsers) {
      await supabase.from('claims').delete().eq('event_id', eventId).eq('user_id', uid);
    }

    // Clear course_preference and partner_ids for all affected users
    for (const uid of allUsers) {
      const { data: existingRsvp } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', uid)
        .maybeSingle();

      if (existingRsvp) {
        await supabase
          .from('rsvps')
          .update({
            course_preference: null,
            partner_ids: [],
          })
          .eq('id', existingRsvp.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unclaim API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
