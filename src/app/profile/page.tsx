'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataRepository } from '@/lib/db/repository';
import { useMyIdentity } from '@/lib/auth/identity';
import { Rating, ChallengeAttempt, Climb } from '@/types';
import { User, Star, Clock3, Zap, Trophy } from 'lucide-react';

export default function ProfilePage() {
  const identity = useMyIdentity();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [attempts, setAttempts] = useState<ChallengeAttempt[]>([]);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      DataRepository.getRatings(),
      DataRepository.getChallengeAttempts(),
      DataRepository.getClimbs(),
    ]).then(([r, a, c]) => {
      setRatings(r);
      setAttempts(a);
      setClimbs(c);
      setLoading(false);
    });
  }, []);

  const matchesMe = (userId?: string | null, displayName?: string) => {
    if (identity.isAuthenticated && identity.id) return userId === identity.id;
    if (!identity.isAuthenticated) return displayName === identity.displayName;
    return false;
  };

  const myRatings = ratings.filter(r => matchesMe(r.user_id, r.user_display_name));
  const myAttempts = attempts.filter(a => matchesMe(a.user_id, a.user_display_name));
  const climbMap = new Map(climbs.map(c => [c.id, c]));

  const bestSpeed = myAttempts.filter(a => a.challenge_type === 'speed').sort((a, b) => a.value - b.value)[0];
  const bestHolds = myAttempts.filter(a => a.challenge_type === 'fewest_holds').sort((a, b) => a.value - b.value)[0];

  return (
    <main className="bg-slate-950 min-h-full">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3.5 flex items-center gap-2">
        <User className="w-5 h-5 text-emerald-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">My Stats</span>
      </header>

      <div className="px-4 py-5 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-sm font-bold text-slate-100">{identity.displayName}</p>
          {!identity.isAuthenticated && (
            <p className="text-xs text-slate-500 mt-1">
              Stats here are matched by display name on this device.{' '}
              <Link href="/login" className="text-emerald-400 font-semibold">
                Sign in
              </Link>{' '}
              for stats that follow you everywhere.
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 italic">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <Star className="w-4 h-4 text-amber-400 mb-2" />
                <p className="text-2xl font-black text-white">{myRatings.length}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Ratings Given</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <Trophy className="w-4 h-4 text-emerald-400 mb-2" />
                <p className="text-2xl font-black text-white">{myAttempts.length}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Challenge Attempts</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Personal Bests</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-slate-300 flex-shrink-0">
                    <Clock3 className="w-4 h-4 text-emerald-400" /> Fastest Climb
                  </span>
                  {bestSpeed ? (
                    <span className="text-sm font-bold text-emerald-400 text-right truncate">
                      {bestSpeed.value}s · {climbMap.get(bestSpeed.climb_id)?.name || 'Unknown climb'}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No attempts yet</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-slate-300 flex-shrink-0">
                    <Zap className="w-4 h-4 text-violet-400" /> Fewest Holds
                  </span>
                  {bestHolds ? (
                    <span className="text-sm font-bold text-violet-400 text-right truncate">
                      {bestHolds.value} · {climbMap.get(bestHolds.climb_id)?.name || 'Unknown climb'}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No attempts yet</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
