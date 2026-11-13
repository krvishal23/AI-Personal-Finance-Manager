import { ArrowRight, Lightbulb, PiggyBank, Sparkles } from 'lucide-react';
import {
  formatCurrency,
  formatMonthLabel,
  type AiInsightReport,
  type CategoryBreakdown,
  type DailyPoint,
  type Expense,
  type MonthlySummary,
  type SavingsEntry,
  type SavingsSummary,
} from '../shared/finance';
import { CategoryBreakdownPanel } from './CategoryBreakdownPanel';
import { DailySpendingChart } from './DailySpendingChart';
import { KpiStrip } from './KpiStrip';

interface OverviewViewProps {
  monthKey: string;
  summary: MonthlySummary;
  savingsSummary: SavingsSummary;
  latestSaving: SavingsEntry | null;
  dailySeries: DailyPoint[];
  categoryBreakdown: CategoryBreakdown[];
  recentExpenses: Expense[];
  aiReport: AiInsightReport | null;
  aiLoading: boolean;
  loading: boolean;
  onGenerateInsights: () => void;
  onViewAllExpenses: () => void;
  onManageBudgets: () => void;
  onOpenSavings: () => void;
  onOpenAiWorkspace: () => void;
  onLogFirstExpense: () => void;
}

export function OverviewView({
  monthKey,
  summary,
  savingsSummary,
  latestSaving,
  dailySeries,
  categoryBreakdown,
  recentExpenses,
  aiReport,
  aiLoading,
  loading,
  onGenerateInsights,
  onViewAllExpenses,
  onManageBudgets,
  onOpenSavings,
  onOpenAiWorkspace,
  onLogFirstExpense,
}: OverviewViewProps) {
  return (
    <div className="space-y-10">
      <KpiStrip summary={summary} loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-stretch pb-8 border-b border-white/15">
        <div className="xl:col-span-7 flex flex-col">
          <DailySpendingChart
            points={dailySeries}
            monthKey={monthKey}
            totalBudget={summary.totalBudget}
            dailyAverage={summary.dailyAverage}
            peakDay={summary.peakDay}
            topMerchant={summary.topMerchant}
          />
        </div>

        <div className="xl:col-span-5 flex flex-col xl:border-l xl:border-white/12 xl:pl-8">
          <CategoryBreakdownPanel
            breakdown={categoryBreakdown}
            onManageBudgets={onManageBudgets}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <section className="xl:col-span-7">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/12">
            <div>
              <h2 className="text-base font-semibold text-white">
                Recent Daily Expenses
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Latest entries recorded in {formatMonthLabel(monthKey)}
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAllExpenses}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 whitespace-nowrap shrink-0 rounded px-2 py-1 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              <span>View Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-white">
                No expenses recorded for {formatMonthLabel(monthKey)}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Log your first daily purchase to begin tracking category pacing.
              </p>
              <button
                type="button"
                onClick={onLogFirstExpense}
                className="mt-4 h-9 px-4 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Log First Expense
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/12 text-xs font-medium text-slate-300">
                    <th className="py-2.5 pr-3">Merchant</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 pl-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm">
                  {recentExpenses.slice(0, 6).map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-white truncate max-w-[200px]">
                          {exp.merchant}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-200 whitespace-nowrap">
                        {exp.category}
                      </td>
                      <td className="py-2.5 px-3 text-xs font-mono tabular-nums text-slate-300 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-medium text-white whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="xl:col-span-5 xl:border-l xl:border-white/12 xl:pl-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/12">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-300 shrink-0" aria-hidden="true" />
                <h2 className="text-base font-semibold text-white">
                  AI Monthly Insights
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenAiWorkspace}
                className="text-xs font-medium text-emerald-300 hover:text-emerald-200 whitespace-nowrap shrink-0 rounded px-2 py-1 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                Open Advisor
              </button>
            </div>

            {aiReport ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-white leading-snug">
                  {aiReport.headline}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {aiReport.summary}
                </p>
                {aiReport.recommendations[0] && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs font-medium text-slate-300">
                      Top Savings Opportunity · {aiReport.recommendations[0].category}
                    </p>
                    <p className="mt-1 text-sm text-slate-100">
                      {aiReport.recommendations[0].title}
                      {aiReport.recommendations[0].estimatedMonthlySavings > 0 && (
                        <span className="font-mono tabular-nums font-semibold text-emerald-300">
                          {' '}
                          (Save ~{formatCurrency(aiReport.recommendations[0].estimatedMonthlySavings)}/mo)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <p className="text-sm font-medium text-white">
                  Uncover spending patterns for {formatMonthLabel(monthKey)}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Generate an AI budget review analyzing your daily burn rate, category anomalies, and savings opportunities.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-white/12 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-300">
              {aiReport
                ? `Updated ${new Date(aiReport.generatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Ready to analyze ledger'}
            </span>
            <button
              type="button"
              onClick={onGenerateInsights}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-white/20 bg-white/10 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
              <span>{aiLoading ? 'Analyzing...' : aiReport ? 'Refresh Insights' : 'Analyze Month'}</span>
            </button>
          </div>
        </section>
      </div>

      <section aria-label="Savings Count" className="pt-8 border-t border-white/15">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/12">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-emerald-300 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-white">Savings Count</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Cumulative Gullak reserves and deposit activity for {formatMonthLabel(monthKey)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSavings}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 whitespace-nowrap shrink-0 rounded px-2 py-1 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <span>Open Savings</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-y-6 xl:divide-x xl:divide-white/12">
          <div className="xl:pr-6">
            <p className="text-xs font-medium text-slate-300">Total Gullak Balance</p>
            <p className="mt-1.5 text-2xl font-semibold text-white font-mono tabular-nums">
              {formatCurrency(savingsSummary.totalSaved)}
            </p>
            <p className="mt-1 text-xs text-slate-300 tabular-nums">
              {savingsSummary.totalCount} total {savingsSummary.totalCount === 1 ? 'deposit' : 'deposits'}
            </p>
          </div>

          <div className="xl:px-6">
            <p className="text-xs font-medium text-slate-300">Saved This Month</p>
            <p className="mt-1.5 text-2xl font-semibold text-emerald-300 font-mono tabular-nums">
              {formatCurrency(savingsSummary.monthSaved)}
            </p>
            <p className="mt-1 text-xs text-slate-300 tabular-nums">
              {savingsSummary.monthCount} {savingsSummary.monthCount === 1 ? 'deposit' : 'deposits'} in{' '}
              {formatMonthLabel(monthKey)}
            </p>
          </div>

          <div className="xl:px-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span>Monthly Savings Goal</span>
              <span className="font-mono tabular-nums text-white">
                {savingsSummary.targetProgressPct}%
              </span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-white font-mono tabular-nums">
              {formatCurrency(savingsSummary.monthlyTarget)}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, savingsSummary.targetProgressPct))}%` }}
              />
            </div>
          </div>

          <div className="xl:pl-6">
            <p className="text-xs font-medium text-slate-300">Latest Deposit</p>
            <p className="mt-1.5 text-base font-semibold text-white truncate">
              {latestSaving ? latestSaving.title : 'No deposits logged yet'}
            </p>
            <p className="mt-1 text-xs text-slate-300 tabular-nums truncate">
              {latestSaving
                ? `${formatCurrency(latestSaving.amount)} · ${latestSaving.pot} · ${latestSaving.date}`
                : 'Add your first deposit to track reserves'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
