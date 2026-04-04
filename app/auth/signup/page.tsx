'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rsvpName, setRsvpName] = useState('');

  useEffect(() => {
    // Pre-fill from RSVP if available
    const name = sessionStorage.getItem('rsvp_name');
    if (name) setRsvpName(name);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords don\'t match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabase();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create initial profile row
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: rsvpName || '',
        dietary_restrictions: [],
        role: 'member',
      });

      // Create RSVP if we have event info
      const eventId = sessionStorage.getItem('rsvp_event_id');
      const rsvpStatus = sessionStorage.getItem('rsvp_status');
      if (eventId && rsvpStatus) {
        await supabase.from('rsvps').upsert({
          event_id: eventId,
          user_id: data.user.id,
          status: rsvpStatus,
        });
        sessionStorage.removeItem('rsvp_event_id');
        sessionStorage.removeItem('rsvp_status');
        sessionStorage.removeItem('rsvp_name');
      }

      router.push('/profile');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display italic text-3xl mb-2" style={{ color: 'var(--ink)' }}>
            Join the Club
          </h1>
          <p className="font-body text-sm" style={{ color: 'var(--accent-warm)' }}>
            Create your Girls Supper Club account
          </p>
          {rsvpName && (
            <p className="font-display italic text-base mt-2" style={{ color: 'var(--accent)' }}>
              Welcome, {rsvpName} ♡
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block font-body text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--accent-warm)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-elegant font-body"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block font-body text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--accent-warm)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-elegant font-body"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label className="block font-body text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--accent-warm)' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-elegant font-body"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm font-body" style={{ color: 'var(--accent)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-elegant-filled w-full py-3 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Links */}
        <div className="text-center mt-8">
          <Link
            href="/auth/login"
            className="font-body text-sm underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent-warm)' }}
          >
            Already have an account? Sign in →
          </Link>
        </div>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="font-body text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent-warm)', opacity: 0.6 }}
          >
            ← Back to invitation
          </Link>
        </div>
      </div>
    </main>
  );
}
