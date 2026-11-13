import {
  formatCurrency,
  type CategoryBreakdown,
} from '../shared/finance';

interface CategoryBreakdownPanelProps {
  breakdown: CategoryBreakdown[];
  onManageBudgets: () => void;
}

export function CategoryBreakdownPanel({
  breakdown,
  onManageBudgets,
}: CategoryBreakdownPanelProps) {
  const statusText = (item: CategoryBreakdown) => {
    switch (item.status) {
      case 'over':
        return { label: 'Over budget', cls: 'text-red-300' };
      case 'warning':
        return {
          label: item.utilizationPct >= 100 ? 'At limit' : 'Near limit',
          cls: 'text-amber-300',
        };
      case 'nominal':
      default:
        return { label: 'On track', cls: 'text-emerald-300' };
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/12">
        <div>
          <h2 className="text-base font-semibold text-white">
            Category Budgets
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Monthly spend vs. target allocation
          </p>
        </div>
        <button
          type="button"
          onClick={onManageBudgets}
          className="text-xs font-medium text-emerald-300 hover:text-emerald-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-400 rounded px-2 py-1"
        >
          Adjust Limits
        </button>
      </div>

      <div className="divide-y divide-white/10 mt-1">
        {breakdown.slice(0, 7).map((item) => {
          const barWidth = Math.min(100, Math.max(0, item.utilizationPct));
          const meta = statusText(item);
          const barColor =
            item.status === 'over'
              ? 'bg-red-400'
              : item.status === 'warning'
                ? 'bg-amber-400'
                : 'bg-emerald-400';

          return (
            <div key={item.category} className="py-3">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-white truncate">
                  {item.category}
                </span>
                <span className="font-mono tabular-nums text-xs text-slate-300 shrink-0">
                  <strong className="font-semibold text-white">
                    {formatCurrency(item.spent)}
                  </strong>{' '}
                  / {formatCurrency(item.budget)}
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className={`font-medium ${meta.cls}`}>
                  {meta.label} · {item.utilizationPct}%
                </span>
                <span className="text-slate-300 tabular-nums">
                  {item.remaining >= 0
                    ? `${formatCurrency(item.remaining)} left`
                    : `${formatCurrency(Math.abs(item.remaining))} over`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
