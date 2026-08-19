'use client';

import { UserRole } from '@/types';
import { useUserRole } from '@/lib/auth/role';

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: 'climber', label: 'Climber', hint: 'Rate climbs, compete on leaderboards' },
  { value: 'setter', label: 'Setter', hint: 'Add/edit climbs and walls' },
  { value: 'owner', label: 'Gym Owner', hint: 'Full gym management access' },
];

export default function RoleSwitcher() {
  const [role, setRole] = useUserRole();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Viewing as</p>
      <p className="text-[11px] text-slate-500 mb-3">
        Real sign-in isn&apos;t wired up yet — this switch stands in for it during development.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {ROLE_OPTIONS.map(option => {
          const isActive = role === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={`rounded-xl border px-2 py-2.5 text-center transition ${
                isActive
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                  : 'border-slate-700 bg-slate-950/40 text-slate-300'
              }`}
            >
              <span className="block text-xs font-bold">{option.label}</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
