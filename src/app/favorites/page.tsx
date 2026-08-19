'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataRepository } from '@/lib/db/repository';
import { useFavoriteGymIds } from '@/lib/favorites';
import { Gym } from '@/types';
import { Heart, Mountain, MapPin } from 'lucide-react';

export default function FavoritesPage() {
  const favoriteIds = useFavoriteGymIds();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataRepository.getGyms().then(g => {
      setGyms(g);
      setLoading(false);
    });
  }, []);

  const favoriteGyms = gyms.filter(g => favoriteIds.includes(g.id));

  return (
    <main className="bg-slate-950 min-h-full">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3.5 flex items-center gap-2">
        <Heart className="w-5 h-5 text-rose-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">Favorites</span>
      </header>

      <div className="px-4 py-5">
        {loading ? (
          <p className="text-sm text-slate-500 italic">Loading...</p>
        ) : favoriteGyms.length === 0 ? (
          <div className="text-center py-10">
            <Mountain className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No favorite gyms yet.</p>
            <Link href="/gyms" className="text-xs font-semibold text-emerald-400 mt-2 inline-block">
              Browse gyms →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {favoriteGyms.map(gym => (
              <Link
                key={gym.id}
                href={`/gyms/${gym.id}`}
                className="block bg-slate-900 border border-slate-800 active:border-emerald-500/50 rounded-2xl p-4 transition"
              >
                <p className="font-bold text-slate-100 text-sm">{gym.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {gym.location}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
