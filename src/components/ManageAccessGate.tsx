'use client';

import { ShieldAlert } from 'lucide-react';
import { isGymStaff, useUserRole } from '@/lib/auth/role';
import { useAuth } from '@/lib/auth/AuthProvider';
import RoleSwitcher from './RoleSwitcher';

export default function ManageAccessGate({ children }: { children: React.ReactNode }) {
  const [role] = useUserRole();
  const { isConfigured, user } = useAuth();

  if (!isGymStaff(role)) {
    return (
      <div className="space-y-5">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 text-center">
          <ShieldAlert className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <h2 className="font-bold text-slate-100 text-sm">Setter/Owner access required</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isConfigured
              ? user
                ? "Your account doesn't have setter or owner access yet. Ask a gym owner to upgrade your role."
                : 'Sign in with a setter or owner account to manage climbs and QR tags.'
              : "Gym management is restricted to setters and owners so climbers can't edit climbs or QR tags."}
          </p>
        </div>
        {isConfigured ? (
          <a
            href="/login"
            className="block text-center bg-emerald-500 text-slate-950 font-black text-sm py-2.5 rounded-xl"
          >
            {user ? 'Manage account' : 'Sign in'}
          </a>
        ) : (
          <RoleSwitcher />
        )}
      </div>
    );
  }

  return <>{children}</>;
}
