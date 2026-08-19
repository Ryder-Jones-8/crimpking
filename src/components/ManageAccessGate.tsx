'use client';

import { ShieldAlert } from 'lucide-react';
import { isGymStaff, useUserRole } from '@/lib/auth/role';
import RoleSwitcher from './RoleSwitcher';

export default function ManageAccessGate({ children }: { children: React.ReactNode }) {
  const [role] = useUserRole();

  if (!isGymStaff(role)) {
    return (
      <div className="space-y-5">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 text-center">
          <ShieldAlert className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <h2 className="font-bold text-slate-100 text-sm">Setter/Owner access required</h2>
          <p className="text-xs text-slate-400 mt-1">
            Gym management is restricted to setters and owners so climbers can&apos;t edit climbs or QR tags.
          </p>
        </div>
        <RoleSwitcher />
      </div>
    );
  }

  return <>{children}</>;
}
