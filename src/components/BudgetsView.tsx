import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  formatCurrency,
  formatMonthLabel,
  validateBudgetAmount,
  type CategoryBreakdown,
  type MonthlySummary,
} from '../shared/finance';

interface BudgetsViewProps {
  monthKey: string;
  summary: MonthlySummary;
  breakdown: CategoryBreakdown[];
  onSaveBudget: (category: string, limitAmount: number) => Promise<void>;
}

export function BudgetsView({
  monthKey,
  summary,
  breakdown,
  onSaveBudget,
}: BudgetsViewProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [savedCategory, setSavedCategory] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    for (const item of breakdown) {
      nextDrafts[item.category] = item.budget.toFixed(0);
    }
    setDrafts(nextDrafts);
    setRowErrors({});
  }, [breakdown, monthKey]);

  const handleSaveRow = async (category: string) => {
    const raw = drafts[category] ?? '0';
    const parsed = Number(raw);
    const err = validateBudgetAmount(parsed);
    if (err) {
      setRowErrors((prev) => ({ ...prev, [category]: err }));
      return;
    }

    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
    setSavingCategory(category);
    try {
      await onSaveBudget(category, parsed);
      setSavedCategory(category);
      setTimeout(() => {
        setSavedCategory((curr) => (curr === category ? null : curr));
      }, 2000);
    } catch (saveErr) {
      setRowErrors((prev) => ({
        ...prev,
        [category]:
          saveErr instanceof Error ? saveErr.message : 'Failed to save budget.',
      }));
    } finally {
      setSavingCategory(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-white/15">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              {formatMonthLabel(monthKey)} Budget Plan
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Set monthly spending ceilings per category. Changes immediately update pace projections and AI insights.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm tabular-nums">
            <div>
              <p className="text-xs text-slate-300">Allocated Total</p>
              <p className="font-mono font-semibold text-white">
                {formatCurrency(summary.totalBudget)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Spent So Far</p>
              <p className="font-mono font-semibold text-white">
                {formatCurrency(summary.totalSpent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Projected Month-End</p>
              <p
                className={`font-mono font-semibold ${
                  summary.projectedMonthEnd > summary.totalBudget
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}
              >
                {formatCurrency(summary.projectedMonthEnd)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/15 text-xs font-medium text-slate-300">
              <th className="py-3 pr-3">Category</th>
              <th className="py-3 px-3 text-right">Spent</th>
              <th className="py-3 px-3">Utilization</th>
              <th className="py-3 px-3">Monthly Limit (INR)</th>
              <th className="py-3 pl-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {breakdown.map((item) => {
              const draftVal = drafts[item.category] ?? String(item.budget);
              const isDirty = Number(draftVal) !== item.budget;
              const barWidth = Math.min(100, Math.max(0, item.utilizationPct));
              const barColor =
                item.status === 'over'
                  ? 'bg-red-400'
                  : item.status === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400';

              const statusLabel =
                item.status === 'over'
                  ? 'Over Budget'
                  : item.status === 'warning'
                    ? item.utilizationPct >= 100
                      ? 'At Limit'
                      : 'Near Limit'
                    : 'Nominal';

              const statusTextColor =
                item.status === 'over'
                  ? 'text-red-300'
                  : item.status === 'warning'
                    ? 'text-amber-300'
                    : 'text-emerald-300';

              return (
                <tr key={item.category} className="hover:bg-white/5">
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-white">{item.category}</p>
                    <p className="text-xs text-slate-300 tabular-nums">
                      {item.transactionCount}{' '}
                      {item.transactionCount === 1 ? 'expense' : 'expenses'}
                    </p>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-medium text-white whitespace-nowrap">
                    {formatCurrency(item.spent)}
                  </td>

                  <td className="py-3.5 px-3 min-w-[200px]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={`font-medium ${statusTextColor}`}>
                        {statusLabel}
                      </span>
                      <span className="font-mono tabular-nums text-slate-300">
                        {item.utilizationPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div>
                      <label
                        htmlFor={`budget-input-${item.category}`}
                        className="sr-only"
                      >
                        Monthly budget limit for {item.category}
                      </label>
                      <input
                        id={`budget-input-${item.category}`}
                        type="number"
                        min="0"
                        step="10"
                        value={draftVal}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.category]: e.target.value,
                          }))
                        }
                        className="w-32 h-9 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm font-mono tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                      />
                      {rowErrors[item.category] && (
                        <p className="mt-1 text-xs text-red-300" role="alert">
                          {rowErrors[item.category]}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSaveRow(item.category)}
                      disabled={savingCategory === item.category || !isDirty}
                      aria-label={`Save budget for '${item.category}'`}
                      className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        savedCategory === item.category
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                          : isDirty
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'border border-white/10 bg-white/5 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {savedCategory === item.category ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Saved</span>
                        </>
                      ) : savingCategory === item.category ? (
                        <span>Saving...</span>
                      ) : (
                        <span>Update</span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
