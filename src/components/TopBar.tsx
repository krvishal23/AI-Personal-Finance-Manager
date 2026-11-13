import { Menu, Plus } from 'lucide-react';
import { formatMonthLabel } from '../shared/finance';
import type { NavTab } from './Sidebar';

interface TopBarProps {
  activeTab: NavTab;
  selectedMonth: string;
  availableMonths: string[];
  onChangeMonth: (monthKey: string) => void;
  onOpenNewExpense: () => void;
  onOpenMobileMenu: () => void;
}

const TAB_LABELS: Record<NavTab, string> = {
  overview: 'Overview',
  expenses: 'Daily Expenses',
  budgets: 'Monthly Budgets',
  savings: 'Savings Count',
  insights: 'AI Insights',
};

export function TopBar({
  activeTab,
  selectedMonth,
  availableMonths,
  onChangeMonth,
  onOpenNewExpense,
  onOpenMobileMenu,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/45 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-10 h-16">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400 shrink-0"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-300 whitespace-nowrap shrink-0 hidden sm:inline">
              GULLAK
            </span>
            <span className="text-white/30 hidden sm:inline" aria-hidden="true">
              /
            </span>
            <h1 className="text-sm sm:text-lg font-semibold text-white truncate">
              {TAB_LABELS[activeTab]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center">
            <label htmlFor="month-selector" className="sr-only">
              Select reporting month
            </label>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => onChangeMonth(e.target.value)}
              className="h-9 sm:h-10 max-w-[146px] sm:max-w-none rounded-lg border border-white/15 bg-slate-950/60 px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-slate-100 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 tabular-nums"
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey} className="bg-slate-900 text-slate-100">
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenNewExpense}
            className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-medium hover:bg-emerald-500 active:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Log Expense</span>
            <span className="sm:hidden">Log</span>
          </button>
        </div>
      </div>
    </header>
  );
}
