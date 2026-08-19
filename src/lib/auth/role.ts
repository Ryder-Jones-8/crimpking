'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@/types';
import { useAuth } from './AuthProvider';

const ROLE_KEY = 'tca_active_role_v1';
const ROLE_EVENT = 'tca-role-change';

// Local dev-mode role stand-in, used only when Supabase auth isn't configured.
export function getStoredRole(): UserRole {
  if (typeof window === 'undefined') return 'climber';
  const stored = localStorage.getItem(ROLE_KEY);
  return stored === 'setter' || stored === 'owner' ? stored : 'climber';
}

export function setStoredRole(role: UserRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new CustomEvent(ROLE_EVENT));
}

export function isGymStaff(role: UserRole): boolean {
  return role === 'setter' || role === 'owner';
}

function useLocalDevRole(): [UserRole, (role: UserRole) => void] {
  const [role, setRole] = useState<UserRole>('climber');

  useEffect(() => {
    setRole(getStoredRole());
    const handleChange = () => setRole(getStoredRole());
    window.addEventListener(ROLE_EVENT, handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener(ROLE_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  return [role, setStoredRole];
}

// Real Supabase auth takes over once configured; otherwise falls back to the local dev switcher.
export function useUserRole(): [UserRole, (role: UserRole) => void] {
  const auth = useAuth();
  const [localRole, setLocalRole] = useLocalDevRole();

  if (auth.isConfigured) {
    return [auth.role, () => {}];
  }
  return [localRole, setLocalRole];
}
