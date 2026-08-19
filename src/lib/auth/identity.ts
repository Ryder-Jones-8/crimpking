'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

const NAME_KEY = 'tca_guest_display_name_v1';

// Local dev/guest identity stand-in, used only when nobody is signed in via Supabase.
export function getGuestDisplayName(): string {
  if (typeof window === 'undefined') return 'Guest Climber';
  return localStorage.getItem(NAME_KEY) || 'Guest Climber';
}

export function setGuestDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NAME_KEY, name.trim() || 'Guest Climber');
}

export interface MyIdentity {
  id: string | null;
  displayName: string;
  isAuthenticated: boolean;
}

export function useMyIdentity(): MyIdentity {
  const { user, profile, isConfigured } = useAuth();
  const [guestName, setGuestNameState] = useState('Guest Climber');

  useEffect(() => {
    setGuestNameState(getGuestDisplayName());
  }, []);

  if (isConfigured && user) {
    return { id: user.id, displayName: profile?.display_name || user.email || 'Climber', isAuthenticated: true };
  }
  return { id: null, displayName: guestName, isAuthenticated: false };
}
