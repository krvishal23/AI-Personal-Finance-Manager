import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatMonthLabel, type MonthlySummary } from '../shared/finance';

interface KpiStripProps {
  summary: MonthlySummary;
  loading?: boolean;
}

export function KpiStrip({ summary, loading = false }: KpiStripProps) {
  if (loading) {
    return (
      <section
        aria-label="Monthly summary loading"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 pb-6 border-b border-white/12"
      >
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="space-y-3">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-8 w-32 rounded bg-white/10" />
            <div className="h-3.5 w-36 rounded bg-white/10" />
          </div>
        ))}
      </section>
    );
  }

  const remainingPositive = summary.remainingBudget >= 0;
  const momPct = summary.monthOverMonthPct;

  const statusMeta =
    summary.status === 'over'
      ? { label: 'Over monthly limit', color: 'text-red-300', Icon: AlertTriangle }
      : summary.status === 'warning'
        ? { label: 'Near monthly limit', color: 'text-amber-300', Icon: AlertTriangle }
        : { label: 'Within budget', color: 'text-emerald-300', Icon: CheckCircle2 };

  const StatusIcon = statusMeta.Icon;

  return (
    <section
      aria-label="Monthly financial metrics"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-y-6 sm:gap-y-6 pb-7 border-b border-white/15 xl:divide-x xl:divide-white/12"
    >
      <div className="xl:pr-6">
        <p className="text-xs font-medium text-slate-300">Total Spent</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
          {formatCurrency(summary.totalSpent)}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
          {momPct !== null ? (
            <>
              {momPct > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-amber-300 shrink-0" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
              )}
              <span className="tabular-nums">
                {momPct > 0 ? `+${momPct}%` : `${momPct}%`} vs prior month
              </span>
            </>
          ) : (
            <span>{summary.transactionCount} logged expenses</span>
          )}
        </div>
      </div>

      <div className="xl:px-6">
        <p className="text-xs font-medium text-slate-300">Monthly Budget</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
          {formatCurrency(summary.totalBudget)}
        </p>
        <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${statusMeta.color}`}>
          <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {summary.utilizationPct}% utilized · {statusMeta.label}
          </span>
        </div>
      </div>

      <div className="xl:px-6">
        <p className="text-xs font-medium text-slate-300">Remaining Balance</p>
        <p
          className={`mt-2 text-3xl font-semibold tracking-tight font-mono tabular-nums ${
            remainingPositive ? 'text-white' : 'text-red-300'
          }`}
        >
          {formatCurrency(summary.remainingBudget)}
        </p>
        <p className="mt-2 text-xs text-slate-300 tabular-nums">
          {summary.transactionCount} transactions in {formatMonthLabel(summary.monthKey)}
        </p>
      </div>

      <div className="xl:pl-6">
        <p className="text-xs font-medium text-slate-300">Daily Spend Pace</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
          {formatCurrency(summary.dailyAverage)}
          <span className="text-sm font-normal text-slate-300">/day</span>
        </p>
        <p className="mt-2 text-xs text-slate-300 tabular-nums">
          Proj. month-end: {formatCurrency(summary.projectedMonthEnd)}
        </p>
      </div>
    </section>
  );
}
