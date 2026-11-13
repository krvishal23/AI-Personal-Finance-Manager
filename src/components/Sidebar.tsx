import {
  BarChart3,
  BookOpen,
  Lightbulb,
  PiggyBank,
  ReceiptText,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import avatarImg from '../assets/images/avatar_finance_user_1794583648849.jpg';

export type NavTab = 'overview' | 'expenses' | 'budgets' | 'savings' | 'insights';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'expenses', label: 'Daily Expenses', icon: ReceiptText },
  { id: 'budgets', label: 'Monthly Budgets', icon: Wallet },
  { id: 'savings', label: 'Savings Count', icon: PiggyBank },
  { id: 'insights', label: 'AI Insights', icon: Lightbulb },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [avatarError, setAvatarError] = useState(false);

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-slate-950/55 backdrop-blur-md border-r border-white/10 px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2 pb-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-wide text-white whitespace-nowrap">
              GULLAK
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  isActive
                    ? 'bg-white/12 text-white'
                    : 'text-slate-300 hover:bg-white/6 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-1.5">
          {!avatarError ? (
            <img
              src={avatarImg}
              alt="Elena Vance profile photo"
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="h-9 w-9 rounded-full object-cover border border-white/20 shrink-0"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-semibold shrink-0"
            >
              EV
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">Elena Vance</p>
            <p className="text-xs text-slate-300 truncate">Personal Workspace</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[248px] shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/75"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-[264px] max-w-[80vw] h-full bg-slate-950">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
