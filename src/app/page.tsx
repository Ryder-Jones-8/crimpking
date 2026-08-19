import Link from "next/link";
import { DataRepository } from "@/lib/db/repository";
import { Mountain, QrCode, TrendingUp } from "lucide-react";
import StatsCarousel from "@/components/StatsCarousel";

export default async function HomePage() {
  const gyms = await DataRepository.getGyms();
  const climbs = await DataRepository.getClimbs();
  const ratings = await DataRepository.getRatings();

  const totalRatings = ratings.length;
  const activeClimbs = climbs.filter(c => c.is_active).length;

  return (
    <main className="bg-slate-950 min-h-full">
      {/* App header */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3.5 flex items-center gap-2">
        <Mountain className="w-5 h-5 text-emerald-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">SendCheck</span>
      </header>

      <div className="px-4 py-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black tracking-tight">
            One grade scale, <span className="text-emerald-400">every gym.</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Scan the QR tag next to a climb, rate it against the gym&apos;s stated grade,
            and help the community figure out which gyms grade soft and which grade stiff.
          </p>
        </div>

        {/* Stats */}
        <StatsCarousel
          gymCount={gyms.length}
          activeClimbs={activeClimbs}
          totalRatings={totalRatings}
          wallCount={gyms.reduce((a, g) => a + (g.wall_count || 0), 0)}
        />

        {/* Action cards */}
        <div className="grid grid-cols-1 gap-3">
          <Link
            href="/manage"
            className="group bg-slate-900 border border-slate-800 active:border-emerald-500/50 rounded-2xl p-4 transition flex items-center gap-3"
          >
            <QrCode className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Manage Climbs & QR Tags</h3>
              <p className="text-xs text-slate-400 mt-0.5">Add gyms, walls, and climbs. Generate printable QR tags.</p>
            </div>
          </Link>

          <Link
            href="/normalization"
            className="group bg-slate-900 border border-slate-800 active:border-emerald-500/50 rounded-2xl p-4 transition flex items-center gap-3"
          >
            <TrendingUp className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Gym Grading Bias</h3>
              <p className="text-xs text-slate-400 mt-0.5">See which gyms grade soft or stiff relative to the community.</p>
            </div>
          </Link>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mountain className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm">Recently Set Climbs</h3>
            </div>
            <div className="space-y-2">
              {climbs.slice(0, 3).map(c => (
                <Link
                  key={c.id}
                  href={`/climb/${c.qr_code_token}`}
                  className="flex items-center justify-between text-xs text-slate-300 active:text-emerald-400 py-1"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-slate-500">{c.gym_grade}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
