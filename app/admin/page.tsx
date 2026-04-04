'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import type { Recipe, RecipeImport, Course, Allergen } from '@/lib/types';

const SAMPLE_JSON = `[
  {
    "name": "Roasted Cauliflower with Tahini",
    "page_number": 42,
    "course": "side",
    "allergens": ["nuts"],
    "is_vegetarian": true,
    "is_vegan": true
  },
  {
    "name": "Lamb Kofta with Yogurt",
    "page_number": 98,
    "course": "main",
    "allergens": ["dairy"],
    "is_vegetarian": false,
    "is_vegan": false
  },
  {
    "name": "Honey & Pistachio Semifreddo",
    "page_number": 210,
    "course": "dessert",
    "allergens": ["dairy", "eggs", "nuts"],
    "is_vegetarian": true,
    "is_vegan": false
  }
]`;

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Event form state
  const [volumeNumber, setVolumeNumber] = useState(1);
  const [eventDate, setEventDate] = useState('');
  const [cookbookName, setCookbookName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [colorTheme, setColorTheme] = useState('');

  // Recipe JSON state
  const [jsonInput, setJsonInput] = useState('');
  const [parsedRecipes, setParsedRecipes] = useState<RecipeImport[]>([]);
  const [parseError, setParseError] = useState('');

  // Existing data
  const [existingEventId, setExistingEventId] = useState<string | null>(null);
  const [existingCookbookId, setExistingCookbookId] = useState<string | null>(null);
  const [existingRecipes, setExistingRecipes] = useState<Recipe[]>([]);

  // Status
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    const supabase = createBrowserSupabase();

    // Check if there's an active event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (eventData) {
      setExistingEventId(eventData.id);
      setVolumeNumber(eventData.volume_number);
      setEventDate(eventData.date);
      if (eventData.color_theme) setColorTheme(eventData.color_theme);

      const { data: cookbookData } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('event_id', eventData.id)
        .single();

      if (cookbookData) {
        setExistingCookbookId(cookbookData.id);
        setCookbookName(cookbookData.name);
        if (cookbookData.cover_url) setCoverPreview(cookbookData.cover_url);

        const { data: recipesData } = await supabase
          .from('recipes')
          .select('*')
          .eq('cookbook_id', cookbookData.id)
          .order('course')
          .order('name');

        setExistingRecipes(recipesData || []);
      }
    }

    setLoading(false);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonInput(text);
      parseJson(text);
    };
    reader.readAsText(file);
  };

  const parseJson = (text: string) => {
    setParseError('');
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setParseError('JSON must be an array of recipes');
        return;
      }

      // Validate each recipe
      const validCourses = ['appetizer', 'main', 'side', 'dessert'];
      const validAllergens = ['nuts', 'dairy', 'gluten', 'eggs', 'shellfish', 'soy'];

      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        if (!r.name) { setParseError(`Recipe #${i + 1} missing "name"`); return; }
        if (!validCourses.includes(r.course)) { setParseError(`Recipe "${r.name}" has invalid course "${r.course}". Use: ${validCourses.join(', ')}`); return; }
        if (r.allergens && !Array.isArray(r.allergens)) { setParseError(`Recipe "${r.name}" allergens must be an array`); return; }
        if (r.allergens) {
          for (const a of r.allergens) {
            if (!validAllergens.includes(a)) { setParseError(`Recipe "${r.name}" has invalid allergen "${a}". Use: ${validAllergens.join(', ')}`); return; }
          }
        }
      }

      setParsedRecipes(data);
      setMessage(`Parsed ${data.length} recipes successfully`);
    } catch (err: any) {
      setParseError(`Invalid JSON: ${err.message}`);
      setParsedRecipes([]);
    }
  };

  const handleSaveEvent = async () => {
    if (!eventDate || !cookbookName.trim()) {
      setMessage('Please fill in event date and cookbook name');
      return;
    }

    setSaving(true);
    setMessage('');
    const supabase = createBrowserSupabase();

    try {
      // Upload cover if new
      let coverUrl = coverPreview;
      if (coverFile) {
        const filePath = `covers/${Date.now()}-${coverFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('cookbook-covers')
          .upload(filePath, coverFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('cookbook-covers')
            .getPublicUrl(filePath);
          coverUrl = publicUrl;
        }
      }

      // Upsert event
      let eventId = existingEventId;
      if (eventId) {
        await supabase.from('events').update({
          volume_number: volumeNumber,
          date: eventDate,
          title: `Vol. ${volumeNumber}`,
          color_theme: colorTheme || null,
        }).eq('id', eventId);
      } else {
        const { data: newEvent } = await supabase.from('events').insert({
          volume_number: volumeNumber,
          date: eventDate,
          title: `Vol. ${volumeNumber}`,
          color_theme: colorTheme || null,
          is_active: true,
        }).select().single();
        eventId = newEvent?.id;
        setExistingEventId(eventId!);
      }

      // Upsert cookbook
      let cookbookId = existingCookbookId;
      if (cookbookId) {
        await supabase.from('cookbooks').update({
          name: cookbookName.trim(),
          cover_url: coverUrl || null,
        }).eq('id', cookbookId);
      } else {
        const { data: newCookbook } = await supabase.from('cookbooks').insert({
          name: cookbookName.trim(),
          cover_url: coverUrl || null,
          event_id: eventId!,
        }).select().single();
        cookbookId = newCookbook?.id;
        setExistingCookbookId(cookbookId!);
      }

      setMessage('Event saved!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    }

    setSaving(false);
  };

  const handlePublishRecipes = async () => {
    if (parsedRecipes.length === 0) {
      setMessage('No recipes to publish — paste JSON first');
      return;
    }
    if (!existingCookbookId) {
      setMessage('Save the event first');
      return;
    }

    setSaving(true);
    const supabase = createBrowserSupabase();

    try {
      // Delete existing recipes for this cookbook
      await supabase.from('recipes').delete().eq('cookbook_id', existingCookbookId);

      // Insert new recipes
      const rows = parsedRecipes.map(r => ({
        cookbook_id: existingCookbookId,
        name: r.name,
        page_number: r.page_number || null,
        course: r.course,
        allergens: r.allergens || [],
        is_vegetarian: r.is_vegetarian || false,
        is_vegan: r.is_vegan || false,
      }));

      const { error } = await supabase.from('recipes').insert(rows);
      if (error) throw error;

      setMessage(`Published ${rows.length} recipes!`);
      setExistingRecipes(rows as any);
      setParsedRecipes([]);
      setJsonInput('');
    } catch (err: any) {
      setMessage('Error publishing: ' + err.message);
    }

    setSaving(false);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    const supabase = createBrowserSupabase();
    await supabase.from('recipes').delete().eq('id', recipeId);
    setExistingRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display italic text-3xl" style={{ color: 'var(--ink)' }}>Admin</h1>
          <button onClick={() => router.push('/event')} className="text-sm font-body underline" style={{ color: 'var(--accent-warm)' }}>
            ← Back to event
          </button>
        </div>

        {message && (
          <div className="mb-4 py-2 px-4 rounded text-sm font-body" style={{
            background: message.includes('Error') ? 'rgba(196,71,58,0.1)' : 'rgba(212,184,150,0.2)',
            color: message.includes('Error') ? 'var(--accent)' : 'var(--ink)',
          }}>
            {message}
          </div>
        )}

        {/* ─── SECTION 1: Event Setup ─── */}
        <section className="mb-10">
          <h2 className="font-display italic text-xl mb-4" style={{ color: 'var(--ink)' }}>Event Setup</h2>

          <div className="space-y-4" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Volume #</label>
                <input
                  type="number"
                  value={volumeNumber}
                  onChange={(e) => setVolumeNumber(parseInt(e.target.value) || 1)}
                  className="input-elegant font-body"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="input-elegant font-body"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Cookbook Name</label>
              <input
                type="text"
                value={cookbookName}
                onChange={(e) => setCookbookName(e.target.value)}
                className="input-elegant font-body"
                placeholder="e.g. Ottolenghi Simple"
              />
            </div>

            <div>
              <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Cover Image</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleCoverChange} className="text-sm font-body" />
                {coverPreview && (
                  <img src={coverPreview} alt="Cover" className="w-16 h-20 object-cover rounded" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>
                Color Theme Override (optional JSON)
              </label>
              <input
                type="text"
                value={colorTheme}
                onChange={(e) => setColorTheme(e.target.value)}
                className="input-elegant font-body text-xs font-mono"
                placeholder='{"accent": "#2E6B4E", "accentWarm": "#8BA888"}'
              />
            </div>

            <button onClick={handleSaveEvent} disabled={saving} className="btn-elegant-filled py-2 px-6 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </section>

        {/* ─── SECTION 2: Recipe JSON Input ─── */}
        <section className="mb-10">
          <h2 className="font-display italic text-xl mb-4" style={{ color: 'var(--ink)' }}>Recipe Data</h2>

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px' }}>
            <p className="text-xs font-body mb-3" style={{ color: 'var(--accent-warm)' }}>
              Paste a JSON array of recipes, or upload a .json file. See format below.
            </p>

            {/* File upload */}
            <div className="mb-4">
              <input type="file" accept=".json" onChange={handleJsonFile} className="text-sm font-body" />
            </div>

            {/* Textarea */}
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                if (e.target.value.trim()) parseJson(e.target.value);
              }}
              rows={12}
              className="w-full font-mono text-xs p-3 rounded"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--accent-warm)',
                color: 'var(--ink)',
                resize: 'vertical',
              }}
              placeholder={SAMPLE_JSON}
            />

            {parseError && (
              <p className="text-xs font-body mt-2" style={{ color: 'var(--accent)' }}>
                ❌ {parseError}
              </p>
            )}

            {parsedRecipes.length > 0 && (
              <p className="text-xs font-body mt-2" style={{ color: 'var(--ink)' }}>
                ✅ {parsedRecipes.length} recipes parsed
              </p>
            )}

            {/* Preview table */}
            {parsedRecipes.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--accent-warm)' }}>
                      <th className="text-left py-2 pr-3">Name</th>
                      <th className="text-left py-2 pr-3">Page</th>
                      <th className="text-left py-2 pr-3">Course</th>
                      <th className="text-left py-2 pr-3">Allergens</th>
                      <th className="text-left py-2">Veg?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRecipes.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(212,184,150,0.2)' }}>
                        <td className="py-1.5 pr-3">{r.name}</td>
                        <td className="py-1.5 pr-3">{r.page_number || '—'}</td>
                        <td className="py-1.5 pr-3">{r.course}</td>
                        <td className="py-1.5 pr-3">{(r.allergens || []).join(', ') || '—'}</td>
                        <td className="py-1.5">{r.is_vegetarian ? '🌱' : '🍖'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handlePublishRecipes}
                disabled={saving || parsedRecipes.length === 0}
                className="btn-elegant-filled py-2 px-6 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : `Publish ${parsedRecipes.length} Recipes`}
              </button>
              <button
                onClick={() => { setJsonInput(SAMPLE_JSON); parseJson(SAMPLE_JSON); }}
                className="text-xs font-body underline"
                style={{ color: 'var(--accent-warm)' }}
              >
                Load sample
              </button>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: Current Recipes ─── */}
        {existingRecipes.length > 0 && (
          <section>
            <h2 className="font-display italic text-xl mb-4" style={{ color: 'var(--ink)' }}>
              Published Recipes ({existingRecipes.length})
            </h2>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px' }}>
              <table className="w-full text-xs font-body">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--accent-warm)' }}>
                    <th className="text-left py-2 pr-3">Name</th>
                    <th className="text-left py-2 pr-3">Page</th>
                    <th className="text-left py-2 pr-3">Course</th>
                    <th className="text-left py-2 pr-3">Veg?</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {existingRecipes.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(212,184,150,0.2)' }}>
                      <td className="py-1.5 pr-3">{r.name}</td>
                      <td className="py-1.5 pr-3">{r.page_number || '—'}</td>
                      <td className="py-1.5 pr-3">{r.course}</td>
                      <td className="py-1.5 pr-3">{r.is_vegetarian ? '🌱' : '🍖'}</td>
                      <td className="py-1.5">
                        <button
                          onClick={() => handleDeleteRecipe(r.id)}
                          className="text-xs underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* JSON Format Reference */}
        <section className="mt-10 mb-20">
          <details>
            <summary className="cursor-pointer font-body text-sm" style={{ color: 'var(--accent-warm)' }}>
              📋 Recipe JSON Format Reference
            </summary>
            <pre className="mt-3 p-4 rounded text-xs font-mono overflow-x-auto" style={{
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--accent-warm)',
            }}>
              {`[
  {
    "name": "Recipe Name",         // required string
    "page_number": 42,             // number or null
    "course": "main",              // "appetizer" | "main" | "side" | "dessert"
    "allergens": ["dairy", "nuts"],// array of: "nuts" | "dairy" | "gluten" | "eggs" | "shellfish" | "soy"
    "is_vegetarian": false,        // boolean
    "is_vegan": false              // boolean
  }
]`}
            </pre>
          </details>
        </section>
      </div>
    </main>
  );
}
