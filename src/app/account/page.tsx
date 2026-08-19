'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Mountain, LogOut, ShieldCheck } from 'lucide-react';

export default function AccountPage() {
  const { isConfigured, loading, user, profile, role, signOut } = useAuth();

  return (
    <main className="bg-slate-950 min-h-full px-4 py-6">
      <header className="flex items-center gap-2 mb-6">
        <Mountain className="w-5 h-5 text-emerald-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">Account</span>
      </header>

      {!isConfigured ? (
        <p className="text-sm text-slate-400">
          Supabase auth isn&apos;t configured in this environment — the app is running in local demo mode.
        </p>
      ) : loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : user ? (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm font-bold text-slate-100">{profile?.display_name || user.email}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              {role.toUpperCase()}
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-200 font-bold text-sm py-3 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">You&apos;re not signed in.</p>
          <Link
            href="/login"
            className="block text-center bg-emerald-500 text-slate-950 font-black text-sm py-3 rounded-xl"
          >
            Sign In
          </Link>
        </div>
      )}
    </main>
  );
}
