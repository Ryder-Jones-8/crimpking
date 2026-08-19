import Link from "next/link";
import { notFound } from "next/navigation";
import { DataRepository } from "@/lib/db/repository";
import FavoriteButton from "@/components/FavoriteButton";
import { ChevronLeft, MapPin, Layers, TrendingUp, TrendingDown, Minus, Clock3, Zap } from "lucide-react";

export default async function GymDetailPage({ params }: { params: { gymId: string } }) {
  const gym = await DataRepository.getGymById(params.gymId);
  if (!gym) {
    notFound();
  }

  const walls = await DataRepository.getWalls(gym.id);
  const climbs = await DataRepository.getClimbs({ gym_id: gym.id });
  const { gymStats } = await DataRepository.getNormalizationStats();
  const stat = gymStats.find(s => s.gym_id === gym.id);
  const speedBoard = await DataRepository.getGymLeaderboard(gym.id, 'speed');
  const holdsBoard = await DataRepository.getGymLeaderboard(gym.id, 'fewest_holds');

  return (
    <main className="bg-slate-950 min-h-full pb-8">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-2 py-3 flex items-center gap-1">
        <Link href="/gyms" className="p-2 text-slate-300 active:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-sm text-slate-200 truncate">{gym.name}</span>
      </header>

      <div className="px-4 py-5 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-100">{gym.name}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {gym.location}
              </p>
            </div>
            <FavoriteButton gymId={gym.id} />
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-3">
            <Layers className="w-3 h-3" /> {walls.length} walls • {climbs.length} active climbs
          </p>
        </div>

        {stat && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Grading Bias</h3>
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
            <Link href="/normalization" className="text-[11px] text-emerald-400 font-semibold mt-3 inline-block">
              View full grading bias report →
            </Link>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Gym Leaderboards</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <Clock3 className="w-3.5 h-3.5 text-emerald-400" /> Speed Run
              </p>
              {speedBoard.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No attempts yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {speedBoard.slice(0, 5).map(entry => (
                    <div key={`${entry.user_display_name}-${entry.rank}`} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate">#{entry.rank} {entry.user_display_name}</span>
                      <span className="text-emerald-400 font-bold flex-shrink-0">{entry.value}s</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-violet-400" /> Fewest Holds
              </p>
              {holdsBoard.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No attempts yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {holdsBoard.slice(0, 5).map(entry => (
                    <div key={`${entry.user_display_name}-${entry.rank}`} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate">#{entry.rank} {entry.user_display_name}</span>
                      <span className="text-violet-400 font-bold flex-shrink-0">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Active Climbs</h3>
          <div className="space-y-2.5">
            {climbs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No active climbs at this gym yet.</p>
            ) : (
              climbs.map(climb => (
                <Link
                  key={climb.id}
                  href={`/climb/${climb.qr_code_token}`}
                  className="block bg-slate-900 border border-slate-800 active:border-emerald-500/50 rounded-xl p-4 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100 text-sm truncate">{climb.name}</p>
                    <span className="text-xs font-bold text-emerald-400 flex-shrink-0">{climb.gym_grade}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{climb.wall_name} • {climb.color} holds</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
