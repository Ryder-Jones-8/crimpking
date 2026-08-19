'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mountain, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase isn't configured for this environment.");
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign-up') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split('@')[0] } },
        });
        if (signUpError) throw signUpError;
        setMessage('Check your email to confirm your account, then sign in.');
        setMode('sign-in');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-950 min-h-full px-4 py-8 flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <Mountain className="w-5 h-5 text-emerald-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">SendCheck</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 className="text-xl font-black text-slate-100 mb-1">
          {mode === 'sign-in' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {mode === 'sign-in'
            ? 'Sign in to rate climbs and manage your gym.'
            : 'Sign up as a climber, setter, or gym owner.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'sign-up' && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100"
          />

          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
          {message && <p className="text-xs text-emerald-400 font-medium">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 font-black text-sm py-3 rounded-xl disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-4 block w-full text-center text-xs font-semibold text-emerald-400"
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>

        <Link href="/" className="mt-6 block text-center text-xs text-slate-500">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
