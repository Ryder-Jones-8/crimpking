import { DataRepository } from '@/lib/db/repository';
import { Trophy, Clock3, Zap } from 'lucide-react';

export default async function LeaderboardsPage() {
  const speedBoard = await DataRepository.getGlobalLeaderboard('speed');
  const holdBoard = await DataRepository.getGlobalLeaderboard('fewest_holds');

  return (
    <main className="bg-slate-950 min-h-full pb-24 px-4 py-6">
      <header className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-black text-slate-100">Climber Leaderboards</h1>
        </div>
        <p className="text-sm text-slate-400">Fastest sends and least-hold battles across the community.</p>
      </header>

      <div className="space-y-5">
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Speed Run</h2>
          </div>
          <div className="space-y-2">
            {speedBoard.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No speed attempts logged yet.</p>
            ) : (
              speedBoard.map(entry => (
                <div key={`${entry.user_display_name}-${entry.rank}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-emerald-400">#{entry.rank}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{entry.user_display_name}</p>
                      <p className="text-[10px] text-slate-500">{entry.climb_name || 'Unknown climb'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-400">{entry.value}s</p>
                    <p className="text-[10px] text-slate-500">Top send</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-violet-400" />
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Fewest Holds</h2>
          </div>
          <div className="space-y-2">
            {holdBoard.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hold-minimal attempts logged yet.</p>
            ) : (
              holdBoard.map(entry => (
                <div key={`${entry.user_display_name}-${entry.rank}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-violet-400">#{entry.rank}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{entry.user_display_name}</p>
                      <p className="text-[10px] text-slate-500">{entry.climb_name || 'Unknown climb'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-violet-400">{entry.value}</p>
                    <p className="text-[10px] text-slate-500">holds</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
