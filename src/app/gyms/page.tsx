'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataRepository } from '@/lib/db/repository';
import { Gym } from '@/types';
import { Mountain, Search, MapPin, Layers } from 'lucide-react';

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataRepository.getGyms().then(g => {
      setGyms(g);
      setLoading(false);
    });
  }, []);

  const filtered = gyms.filter(
    g =>
      g.name.toLowerCase().includes(query.toLowerCase()) ||
      g.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="bg-slate-950 min-h-full">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3.5 flex items-center gap-2">
        <Mountain className="w-5 h-5 text-emerald-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">Gyms</span>
      </header>

      <div className="px-4 py-5 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search gyms by name or location..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100"
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 italic">Loading gyms...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No gyms match your search.</p>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(gym => (
              <Link
                key={gym.id}
                href={`/gyms/${gym.id}`}
                className="block bg-slate-900 border border-slate-800 active:border-emerald-500/50 rounded-2xl p-4 transition"
              >
                <p className="font-bold text-slate-100 text-sm">{gym.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {gym.location}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-2">
                  <Layers className="w-3 h-3" /> {gym.wall_count} walls • {gym.climb_count} climbs
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
