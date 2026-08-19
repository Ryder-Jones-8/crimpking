'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, BarChart3, Trophy } from 'lucide-react';
import { isGymStaff, useUserRole } from '@/lib/auth/role';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/manage', label: 'Manage', icon: Settings, staffOnly: true },
  { href: '/normalization', label: 'Stats', icon: BarChart3 },
  { href: '/leaderboards', label: 'Leaders', icon: Trophy },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [role] = useUserRole();

  // Hide the tab bar on the focused QR rating flow so it doesn't compete with the submit button.
  if (pathname?.startsWith('/climb/')) return null;

  const visibleTabs = TABS.filter(tab => !tab.staffOnly || isGymStaff(role));

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 safe-bottom">
      <div className="flex items-stretch justify-around">
        {visibleTabs.map(tab => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-w-0"
            >
              <Icon
                className={`w-5 h-5 transition ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-semibold transition ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
