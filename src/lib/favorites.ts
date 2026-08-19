'use client';

import { useEffect, useState } from 'react';

const FAVORITES_KEY = 'tca_favorite_gyms_v1';
const FAVORITES_EVENT = 'tca-favorites-change';

export function getFavoriteGymIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteGym(gymId: string): void {
  if (typeof window === 'undefined') return;
  const current = getFavoriteGymIds();
  const next = current.includes(gymId) ? current.filter(id => id !== gymId) : [...current, gymId];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
}

export function useFavoriteGymIds(): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(getFavoriteGymIds());
    const handleChange = () => setIds(getFavoriteGymIds());
    window.addEventListener(FAVORITES_EVENT, handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  return ids;
}
