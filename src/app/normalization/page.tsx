import Link from "next/link";
import { DataRepository } from "@/lib/db/repository";
import { Mountain, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";

export default async function NormalizationPage({
  searchParams,
}: {
  searchParams: { model?: string };
}) {
  const useFullModel = searchParams.model !== 'simple';
  const { gymStats, climbScores } = await DataRepository.getNormalizationStats(useFullModel);
  const climbs = await DataRepository.getClimbs();
  const ratings = await DataRepository.getRatings();

  const multiGymUserIds = new Set<string>();
  const userGyms = new Map<string, Set<string>>();
  ratings.forEach(r => {
    if (!r.user_id) return;
    const climb = climbs.find(c => c.id === r.climb_id);
    if (!climb) return;
    if (!userGyms.has(r.user_id)) userGyms.set(r.user_id, new Set());
    userGyms.get(r.user_id)!.add(climb.gym_id);
  });
  userGyms.forEach((gymSet, userId) => {
    if (gymSet.size > 1) multiGymUserIds.add(userId);
  });

  return (
    <main className="bg-slate-950 min-h-full">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3.5 flex items-center gap-2">
        <Mountain className="w-5 h-5 text-emerald-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">Grading Bias</span>
      </header>

      <div className="px-4 py-5 space-y-5">
        <p className="text-sm text-slate-400">
          Estimated grading bias per gym, derived from comparative ratings (harder / as graded / easier)
          weighted more heavily for climbers who&apos;ve rated across multiple gyms.
        </p>

        {/* Model toggle */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Link
            href="/normalization?model=full"
            className={`text-center px-3 py-2 rounded-lg font-semibold transition ${
              useFullModel ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Bradley-Terry (Full)
          </Link>
          <Link
            href="/normalization?model=simple"
            className={`text-center px-3 py-2 rounded-lg font-semibold transition ${
              !useFullModel ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Simple Average (Stub)
          </Link>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300/90 flex items-start gap-2">
          <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            <strong>{multiGymUserIds.size}</strong> climber{multiGymUserIds.size === 1 ? ' has' : 's have'} rated
            climbs at more than one gym so far — this is the signal that ties gym grading scales together.
            More cross-gym raters will make bias estimates more reliable.
          </p>
        </div>

        {/* Gym bias cards */}
        <div className="space-y-2.5">
          {gymStats.map(stat => (
            <div key={stat.gym_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-100 text-sm truncate">{stat.gym_name}</p>
                <span
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg text-[11px] ${
                    stat.grading_bias > 0.1
                      ? 'bg-red-500/10 text-red-400'
                      : stat.grading_bias < -0.1
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {stat.grading_bias > 0.1 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : stat.grading_bias < -0.1 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {stat.grading_bias_label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {stat.total_climbs} climbs • {stat.total_ratings} ratings
              </p>
            </div>
          ))}
        </div>

        {/* Per-climb normalized scores */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Per-Climb Normalized Scores</h2>
          <div className="grid grid-cols-1 gap-2.5">
            {climbs.map(climb => {
              const info = climbScores.get(climb.id);
              return (
                <Link
                  key={climb.id}
                  href={`/climb/${climb.qr_code_token}`}
                  className="bg-slate-900 border border-slate-800 active:border-slate-700 rounded-xl p-3.5 flex items-center justify-between transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 text-sm truncate">{climb.name}</p>
                    <p className="text-xs text-slate-500 truncate">{climb.gym_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <p className="text-xs text-slate-500">Stated: {climb.gym_grade}</p>
                    <p className="text-sm font-bold text-emerald-400">
                      → {info?.normalizedGrade || climb.gym_grade}
                      {info && info.offset !== 0 && (
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({info.offset > 0 ? '+' : ''}{info.offset})
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
