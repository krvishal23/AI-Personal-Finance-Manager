import { useMemo, useState } from 'react';
import { Download, Pencil, Search, Trash2 } from 'lucide-react';
import {
  CATEGORIES,
  PAYMENT_METHODS,
  expensesToCsv,
  filterExpenses,
  formatCurrency,
  formatMonthLabel,
  type Expense,
  type ExpenseFilters,
} from '../shared/finance';

interface ExpensesLedgerViewProps {
  monthKey: string;
  expenses: Expense[];
  loading: boolean;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => Promise<void>;
  onLogNewExpense: () => void;
}

export function ExpensesLedgerView({
  monthKey,
  expenses,
  loading,
  onEditExpense,
  onDeleteExpense,
  onLogNewExpense,
}: ExpensesLedgerViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [sortBy, setSortBy] = useState<ExpenseFilters['sortBy']>('date_desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filterExpenses(expenses, {
        search,
        category,
        paymentMethod,
        sortBy,
      }),
    [expenses, search, category, paymentMethod, sortBy]
  );

  const filteredTotal = useMemo(
    () => Math.round(filtered.reduce((sum, e) => sum + e.amount, 0) * 100) / 100,
    [filtered]
  );

  const handleExportCsv = () => {
    const csv = expensesToCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gullak-${monthKey}-expenses.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (exp: Expense) => {
    setDeletingId(exp.id);
    try {
      await onDeleteExpense(exp);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-white/15">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search
                className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="ledger-search" className="sr-only">
                Search expenses by merchant or note
              </label>
              <input
                id="ledger-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search merchant, category, or note..."
                className="w-full h-10 rounded-lg border border-white/15 bg-slate-950/60 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
              />
            </div>

            <div>
              <label htmlFor="ledger-category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="ledger-category-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
              >
                <option value="All" className="bg-slate-900">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ledger-payment-filter" className="sr-only">
                Filter by payment method
              </label>
              <select
                id="ledger-payment-filter"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
              >
                <option value="All" className="bg-slate-900">All Payments</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} className="bg-slate-900">
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ledger-sort" className="sr-only">
                Sort expenses
              </label>
              <select
                id="ledger-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ExpenseFilters['sortBy'])}
                className="h-10 rounded-lg border border-white/15 bg-slate-950/60 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
              >
                <option value="date_desc" className="bg-slate-900">Newest First</option>
                <option value="date_asc" className="bg-slate-900">Oldest First</option>
                <option value="amount_desc" className="bg-slate-900">Highest Amount</option>
                <option value="amount_asc" className="bg-slate-900">Lowest Amount</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
            <div className="text-xs text-slate-300 tabular-nums">
              Showing <strong className="text-white">{filtered.length}</strong> ·{' '}
              <strong className="font-mono text-white">
                {formatCurrency(filteredTotal)}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-white/15 bg-white/8 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="space-y-3" aria-label="Loading expenses">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="h-10 rounded bg-white/10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="text-sm font-semibold text-white">
              {expenses.length === 0
                ? `No expenses logged in ${formatMonthLabel(monthKey)}`
                : 'No matching expenses found'}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {expenses.length === 0
                ? 'Start recording daily transactions to build your monthly spending history.'
                : 'Try adjusting your search query, category, or payment method filter.'}
            </p>
            {expenses.length === 0 ? (
              <button
                type="button"
                onClick={onLogNewExpense}
                className="mt-4 h-9 px-4 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Log First Expense
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                  setPaymentMethod('All');
                }}
                className="mt-4 h-9 px-4 rounded-lg border border-white/15 bg-white/10 text-xs font-medium text-white hover:bg-white/15"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="expenses-table">
              <thead>
                <tr className="border-b border-white/15 text-xs font-medium text-slate-300">
                  <th className="py-3 pr-3">Date</th>
                  <th className="py-3 px-3">Merchant</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-3 font-mono tabular-nums text-xs text-slate-300 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-white">{exp.merchant}</p>
                      {exp.note && (
                        <p className="text-xs text-slate-300 truncate max-w-xs">{exp.note}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-200 whitespace-nowrap">
                      {exp.category}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-300 whitespace-nowrap">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-white whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditExpense(exp)}
                          aria-label={`Edit '${exp.merchant}'`}
                          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exp)}
                          disabled={deletingId === exp.id}
                          aria-label={`Delete '${exp.merchant}'`}
                          className="rounded-lg p-2 text-slate-300 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
