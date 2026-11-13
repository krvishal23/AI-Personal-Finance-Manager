import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Send,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import {
  formatCurrency,
  formatMonthLabel,
  type AiInsightReport,
  type MonthlySummary,
} from '../shared/finance';

interface AiInsightsViewProps {
  monthKey: string;
  summary: MonthlySummary;
  report: AiInsightReport | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
  onAskQuestion: (question: string) => Promise<{ answer: string; source: string }>;
}

const SUGGESTED_QUESTIONS = [
  'Where am I overspending compared to my budget this month?',
  'What is my projected month-end spend at my current daily pace?',
  'Which discretionary category offers the easiest ₹100 savings?',
];

export function AiInsightsView({
  monthKey,
  summary,
  report,
  loading,
  error,
  onGenerate,
  onAskQuestion,
}: AiInsightsViewProps) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [qaError, setQaError] = useState<string | null>(null);

  const submitQuestion = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setQaError('Enter a question about your monthly spending.');
      return;
    }
    setQaError(null);
    setAsking(true);
    try {
      const res = await onAskQuestion(trimmed);
      setQaHistory((prev) => [{ question: trimmed, answer: res.answer }, ...prev]);
      setQuestion('');
    } catch (err) {
      setQaError(err instanceof Error ? err.message : 'Unable to answer question.');
    } finally {
      setAsking(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitQuestion(question);
  };

  return (
    <div className="space-y-10">
      <section className="pb-8 border-b border-white/15">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/12">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {formatMonthLabel(monthKey)} Budget Intelligence
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              AI-assisted analysis of your {summary.transactionCount} logged expenses totaling{' '}
              <span className="font-mono tabular-nums font-medium text-white">
                {formatCurrency(summary.totalSpent)}
              </span>{' '}
              against a{' '}
              <span className="font-mono tabular-nums font-medium text-white">
                {formatCurrency(summary.totalBudget)}
              </span>{' '}
              budget.
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {loading
                ? 'Analyzing Ledger...'
                : report
                  ? 'Regenerate Insights'
                  : 'Generate Monthly Insights'}
            </span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 border-b border-red-400/40 pb-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {loading && !report ? (
          <div className="mt-6 space-y-4" aria-label="Generating monthly insights">
            <div className="h-6 w-2/3 rounded bg-white/10" />
            <div className="h-16 w-full rounded bg-white/10" />
          </div>
        ) : report ? (
          <div className="mt-6 space-y-8">
            <div>
              <p className="text-xs font-medium text-slate-300">
                Executive Summary ·{' '}
                {report.source === 'gemini' ? 'Gemini AI Analysis' : 'Ledger Pace Analysis'}
              </p>
              <h3 className="mt-1.5 text-xl font-semibold text-white leading-snug">
                {report.headline}
              </h3>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed max-w-3xl">
                {report.summary}
              </p>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-white/12">
                <div>
                  <p className="text-xs font-medium text-slate-300">Pace Forecast</p>
                  <p className="mt-1 text-sm text-slate-100 leading-relaxed">
                    {report.paceAssessment}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">Primary Spend Driver</p>
                  <p className="mt-1 text-sm text-slate-100 leading-relaxed">
                    {report.topCategoryObservation}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4 border-t border-white/12">
              <div>
                <h4 className="text-sm font-semibold text-white pb-3 border-b border-white/12">
                  Budget Alerts & Observations
                </h4>
                <div className="divide-y divide-white/10">
                  {report.alerts.map((alert, idx) => {
                    const iconMeta =
                      alert.severity === 'critical'
                        ? {
                            Icon: AlertCircle,
                            color: 'text-red-300',
                            label: 'Over Budget',
                          }
                        : alert.severity === 'warning'
                          ? {
                              Icon: AlertTriangle,
                              color: 'text-amber-300',
                              label: 'Watch',
                            }
                          : {
                              Icon: Info,
                              color: 'text-emerald-300',
                              label: 'On Track',
                            };
                    const AlertIcon = iconMeta.Icon;

                    return (
                      <div key={idx} className="py-4">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <AlertIcon
                            className={`h-4 w-4 shrink-0 ${iconMeta.color}`}
                            aria-hidden="true"
                          />
                          <span className={iconMeta.color}>{iconMeta.label}</span>
                          <span className="text-white/30" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {alert.title}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-200 leading-relaxed">
                          {alert.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:border-l lg:border-white/12 lg:pl-8">
                <h4 className="text-sm font-semibold text-white pb-3 border-b border-white/12">
                  Recommended Adjustments
                </h4>
                <div className="divide-y divide-white/10">
                  {report.recommendations.map((rec, idx) => (
                    <div key={idx} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-300">{rec.category}</p>
                          <p className="mt-0.5 text-sm font-semibold text-white">
                            {rec.title}
                          </p>
                        </div>
                        {rec.estimatedMonthlySavings > 0 && (
                          <div className="flex items-center gap-1 text-xs font-mono tabular-nums font-semibold text-emerald-300 shrink-0">
                            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Save {formatCurrency(rec.estimatedMonthlySavings)}/mo</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-slate-200 leading-relaxed">
                        {rec.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 py-8 text-center">
            <p className="text-sm font-medium text-white">
              No monthly insight report generated yet for {formatMonthLabel(monthKey)}
            </p>
            <p className="mt-1 text-xs text-slate-300 max-w-md mx-auto">
              Click "Generate Monthly Insights" to analyze daily expenses, category limits, and month-over-month trends.
            </p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-base font-semibold text-white">
          Ask About Your {formatMonthLabel(monthKey)} Spending
        </h3>
        <p className="text-xs text-slate-300 mt-1">
          Query your actual transactions, merchant totals, or remaining budget capacity.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={asking}
              onClick={() => submitQuestion(q)}
              className="text-xs text-slate-100 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg px-3 py-1.5 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="ai-question-input" className="sr-only">
              Ask a question about your monthly finances
            </label>
            <input
              id="ai-question-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about your ${formatMonthLabel(monthKey)} expenses...`}
              className="w-full h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
            />
          </div>
          <button
            type="submit"
            disabled={asking}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{asking ? 'Thinking...' : 'Ask Advisor'}</span>
          </button>
        </form>

        {qaError && (
          <p role="alert" className="mt-2 text-xs text-red-300">
            {qaError}
          </p>
        )}

        {qaHistory.length > 0 && (
          <div className="mt-5 divide-y divide-white/10 border-t border-white/12">
            {qaHistory.map((item, idx) => (
              <div key={idx} className="py-4 space-y-1.5">
                <p className="text-xs font-medium text-slate-300">
                  Question: <span className="text-white">{item.question}</span>
                </p>
                <p className="text-sm text-slate-100 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
