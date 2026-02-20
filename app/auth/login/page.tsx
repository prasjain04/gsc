'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if profile exists
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.name) {
        router.push('/profile');
      } else {
        router.push('/event');
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display italic text-3xl mb-2" style={{ color: 'var(--ink)' }}>
            Welcome Back
          </h1>
          <p className="font-body text-sm" style={{ color: 'var(--accent-warm)' }}>
            Sign in to Girls Supper Club
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Links */}
        <div className="text-center mt-8">
          <Link
            href="/auth/signup"
            className="font-body text-sm underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent-warm)' }}
          >
            Don&apos;t have an account? Sign up →
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
