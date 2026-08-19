'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@/types';

const ROLE_KEY = 'tca_active_role_v1';
const ROLE_EVENT = 'tca-role-change';

// No real authentication exists yet — this is a device-local stand-in for a logged-in role.
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

export function useUserRole(): [UserRole, (role: UserRole) => void] {
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
