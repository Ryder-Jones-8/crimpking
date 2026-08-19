'use client';

import { Heart } from 'lucide-react';
import { toggleFavoriteGym, useFavoriteGymIds } from '@/lib/favorites';

export default function FavoriteButton({ gymId }: { gymId: string }) {
  const favoriteIds = useFavoriteGymIds();
  const active = favoriteIds.includes(gymId);

  return (
    <button
      type="button"
      onClick={() => toggleFavoriteGym(gymId)}
      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
        active
          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
          : 'bg-slate-800 border-slate-700 text-slate-300'
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${active ? 'fill-rose-400' : ''}`} />
      {active ? 'Favorited' : 'Favorite'}
    </button>
  );
}
