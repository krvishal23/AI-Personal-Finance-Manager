import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import {
  SAVINGS_POTS,
  formatCurrency,
  formatMonthLabel,
  getMonthKey,
  validateSavingsInput,
  validateSavingsTarget,
  type SavingsEntry,
  type SavingsEntryInput,
  type SavingsSummary,
} from '../shared/finance';

interface SavingsViewProps {
  monthKey: string;
  defaultDate: string;
  entries: SavingsEntry[];
  summary: SavingsSummary;
  loading: boolean;
  onAddSavings: (input: SavingsEntryInput) => Promise<void>;
  onDeleteSavings: (entry: SavingsEntry) => Promise<void>;
  onSaveTarget: (targetAmount: number) => Promise<void>;
}

export function SavingsView({
  monthKey,
  defaultDate,
  entries,
  summary,
  loading,
  onAddSavings,
  onDeleteSavings,
  onSaveTarget,
}: SavingsViewProps) {
  const [title, setTitle] = useState('');
  const [pot, setPot] = useState<string>(SAVINGS_POTS[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [targetDraft, setTargetDraft] = useState(summary.monthlyTarget.toFixed(0));
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    setTargetDraft(summary.monthlyTarget.toFixed(0));
    setTargetError(null);
  }, [summary.monthlyTarget, monthKey]);

  const visibleEntries = useMemo(() => {
    if (scope === 'all') return entries;
    return entries.filter((entry) => getMonthKey(entry.date) === monthKey);
  }, [entries, scope, monthKey]);

  const visibleTotal = useMemo(
    () => Math.round(visibleEntries.reduce((sum, e) => sum + e.amount, 0) * 100) / 100,
    [visibleEntries]
  );

  const potBreakdown = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>();
    for (const potName of SAVINGS_POTS) {
      totals.set(potName, { total: 0, count: 0 });
    }
    for (const entry of entries) {
      const prev = totals.get(entry.pot) ?? { total: 0, count: 0 };
      totals.set(entry.pot, {
        total: Math.round((prev.total + entry.amount) * 100) / 100,
        count: prev.count + 1,
      });
    }
    return Array.from(totals.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [entries]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: SavingsEntryInput = {
      title: title.trim(),
      pot,
      amount: Number(amount),
      date,
      note: note.trim(),
    };

    const validation = validateSavingsInput(payload);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onAddSavings(payload);
      setTitle('');
      setAmount('');
      setNote('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry: SavingsEntry) => {
    setDeletingId(entry.id);
    try {
      await onDeleteSavings(entry);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateTarget = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(targetDraft);
    const err = validateSavingsTarget(parsed);
    if (err) {
      setTargetError(err);
      return;
    }
    setTargetError(null);
    setSavingTarget(true);
    try {
      await onSaveTarget(parsed);
      setTargetSaved(true);
      setTimeout(() => setTargetSaved(false), 2000);
    } catch (saveErr) {
      setTargetError(saveErr instanceof Error ? saveErr.message : 'Unable to save target.');
    } finally {
      setSavingTarget(false);
    }
  };

  const progressWidth = Math.min(100, Math.max(0, summary.targetProgressPct));
  const isTargetDirty = Number(targetDraft) !== summary.monthlyTarget;

  return (
    <div className="space-y-10">
      <section
        aria-label="Savings count metrics"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-y-6 pb-7 border-b border-white/15 xl:divide-x xl:divide-white/12"
      >
        <div className="xl:pr-6">
          <p className="text-xs font-medium text-slate-300">Total Gullak Savings</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
            {formatCurrency(summary.totalSaved)}
          </p>
          <p className="mt-2 text-xs text-slate-300 tabular-nums">
            {summary.totalCount} {summary.totalCount === 1 ? 'deposit' : 'deposits'} recorded overall
          </p>
        </div>

        <div className="xl:px-6">
          <p className="text-xs font-medium text-slate-300">
            Saved in {formatMonthLabel(monthKey)}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300 font-mono tabular-nums">
            {formatCurrency(summary.monthSaved)}
          </p>
          <p className="mt-2 text-xs text-slate-300 tabular-nums">
            {summary.monthCount} {summary.monthCount === 1 ? 'deposit' : 'deposits'} this month
          </p>
        </div>

        <div className="xl:px-6">
          <p className="text-xs font-medium text-slate-300">Monthly Target Progress</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
            {summary.targetProgressPct}%
          </p>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-300 tabular-nums">
            {summary.remainingToTarget > 0
              ? `${formatCurrency(summary.remainingToTarget)} left of ${formatCurrency(summary.monthlyTarget)} goal`
              : `Reached ${formatCurrency(summary.monthlyTarget)} monthly goal`}
          </p>
        </div>

        <div className="xl:pl-6">
          <p className="text-xs font-medium text-slate-300">Average Deposit</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
            {formatCurrency(summary.averageDeposit)}
          </p>
          <p className="mt-2 text-xs text-slate-300 truncate">
            {summary.topPot
              ? `Top pot: ${summary.topPot.pot} (${formatCurrency(summary.topPot.total)})`
              : 'No savings pots funded yet'}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 pb-8 border-b border-white/15">
        <section className="xl:col-span-7">
          <div className="pb-4 border-b border-white/12">
            <h2 className="text-base font-semibold text-white">Add to Savings Count</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Log a new Gullak deposit, SIP transfer, or spare-change sweep.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {submitError && (
              <div role="alert" className="border-b border-red-400/40 pb-2 text-xs text-red-300">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="savings-title"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Deposit Title or Source
                </label>
                <input
                  id="savings-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly SIP, Bonus Sweep"
                  className="w-full h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                />
                {formErrors.title && (
                  <p role="alert" className="mt-1 text-xs text-red-300">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="savings-pot"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Savings Pot
                </label>
                <select
                  id="savings-pot"
                  value={pot}
                  onChange={(e) => setPot(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                >
                  {SAVINGS_POTS.map((item) => (
                    <option key={item} value={item} className="bg-slate-900">
                      {item}
                    </option>
                  ))}
                </select>
                {formErrors.pot && (
                  <p role="alert" className="mt-1 text-xs text-red-300">
                    {formErrors.pot}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="savings-amount"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Amount (INR)
                </label>
                <input
                  id="savings-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm font-mono tabular-nums text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                />
                {formErrors.amount && (
                  <p role="alert" className="mt-1 text-xs text-red-300">
                    {formErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="savings-date"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Date
                </label>
                <input
                  id="savings-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm font-mono tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                />
                {formErrors.date && (
                  <p role="alert" className="mt-1 text-xs text-red-300">
                    {formErrors.date}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="savings-note"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Note (Optional)
                </label>
                <input
                  id="savings-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Short context..."
                  className="w-full h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{submitting ? 'Saving...' : 'Add Savings'}</span>
              </button>
            </div>
          </form>
        </section>

        <section className="xl:col-span-5 xl:border-l xl:border-white/12 xl:pl-8 flex flex-col justify-between gap-6">
          <div>
            <div className="pb-4 border-b border-white/12">
              <h2 className="text-base font-semibold text-white">Savings Pots Breakdown</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Cumulative reserves and deposit count per goal pot
              </p>
            </div>

            <div className="mt-4 divide-y divide-white/10">
              {potBreakdown.map((item) => {
                const sharePct =
                  summary.totalSaved > 0
                    ? Math.round((item.total / summary.totalSaved) * 1000) / 10
                    : 0;
                return (
                  <div key={item.name} className="py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-white truncate">{item.name}</span>
                      <span className="font-mono tabular-nums font-semibold text-white whitespace-nowrap">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, sharePct)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-300 tabular-nums">
                      <span>
                        {item.count} {item.count === 1 ? 'deposit' : 'deposits'}
                      </span>
                      <span>{sharePct}% of total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleUpdateTarget} className="pt-4 border-t border-white/12 space-y-2">
            <label
              htmlFor="monthly-savings-target"
              className="block text-xs font-medium text-slate-200"
            >
              {formatMonthLabel(monthKey)} Savings Target (INR)
            </label>
            <div className="flex items-center gap-2.5">
              <input
                id="monthly-savings-target"
                type="number"
                min="0"
                step="100"
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm font-mono tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={savingTarget || !isTargetDirty}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  targetSaved
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                    : isTargetDirty
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'border border-white/10 bg-white/5 text-slate-400 cursor-not-allowed'
                }`}
              >
                {targetSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Saved</span>
                  </>
                ) : savingTarget ? (
                  <span>Saving...</span>
                ) : (
                  <span>Update Goal</span>
                )}
              </button>
            </div>
            {targetError && (
              <p role="alert" className="text-xs text-red-300">
                {targetError}
              </p>
            )}
          </form>
        </section>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/12">
          <div>
            <h2 className="text-base font-semibold text-white">Savings Deposit Ledger</h2>
            <p className="text-xs text-slate-300 mt-0.5 tabular-nums">
              Showing <strong className="text-white">{visibleEntries.length}</strong>{' '}
              {visibleEntries.length === 1 ? 'deposit' : 'deposits'} ·{' '}
              <strong className="font-mono text-emerald-300">
                {formatCurrency(visibleTotal)}
              </strong>
            </p>
          </div>

          <div
            role="group"
            aria-label="Savings deposit filter scope"
            className="inline-flex rounded-lg border border-white/15 bg-slate-950/50 p-0.5 text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => setScope('month')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                scope === 'month'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {formatMonthLabel(monthKey)}
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                scope === 'all'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3" aria-label="Loading savings deposits">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-10 rounded bg-white/10" />
            ))}
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm font-semibold text-white">
              {scope === 'month'
                ? `No savings deposits logged in ${formatMonthLabel(monthKey)}`
                : 'No savings deposits logged yet'}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Use the form above to record your first savings transfer into GULLAK.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="savings-table">
              <thead>
                <tr className="border-b border-white/15 text-xs font-medium text-slate-300">
                  <th className="py-3 pr-3">Date</th>
                  <th className="py-3 px-3">Deposit</th>
                  <th className="py-3 px-3">Savings Pot</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {visibleEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-3 font-mono tabular-nums text-xs text-slate-300 whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-white">{entry.title}</p>
                      {entry.note && (
                        <p className="text-xs text-slate-300 truncate max-w-xs">{entry.note}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-200 whitespace-nowrap">
                      {entry.pot}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-300 whitespace-nowrap">
                      +{formatCurrency(entry.amount)}
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        disabled={deletingId === entry.id}
                        aria-label={`Delete '${entry.title}'`}
                        className="rounded-lg p-2 text-slate-300 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
