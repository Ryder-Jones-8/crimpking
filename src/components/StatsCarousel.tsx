'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, Mountain, Star, Layers, LucideIcon } from 'lucide-react';

interface StatCardConfig {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  gradient: string;
}

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (target === 0) return;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // Ease-out so the count-up feels snappy at the start and settles gently
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, durationMs]);

  return value;
}

function StatCard({ stat }: { stat: StatCardConfig }) {
  const count = useCountUp(stat.value);
  const Icon = stat.icon;

  return (
    <Link
      href={stat.href}
      className={`rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} active:scale-95 transition-transform duration-150 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-white mt-3 tabular-nums">{count}</p>
      <p className="text-[11px] text-white/80 font-semibold mt-0.5">{stat.label}</p>
    </Link>
  );
}

export default function StatsCarousel({
  gymCount,
  activeClimbs,
  totalRatings,
  wallCount,
}: {
  gymCount: number;
  activeClimbs: number;
  totalRatings: number;
  wallCount: number;
}) {
  const stats: StatCardConfig[] = [
    { label: 'Gyms Tracked', value: gymCount, icon: Building2, href: '/manage', gradient: 'from-emerald-500 to-emerald-800' },
    { label: 'Active Climbs', value: activeClimbs, icon: Mountain, href: '/manage', gradient: 'from-sky-500 to-blue-800' },
    { label: 'Ratings Submitted', value: totalRatings, icon: Star, href: '/normalization', gradient: 'from-amber-400 to-yellow-600' },
    { label: 'Walls / Zones', value: wallCount, icon: Layers, href: '/manage', gradient: 'from-stone-500 to-stone-700' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(stat => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
