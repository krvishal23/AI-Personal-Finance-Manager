import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  CATEGORIES,
  PAYMENT_METHODS,
  validateExpenseInput,
  type Expense,
  type ExpenseInput,
} from '../shared/finance';

interface ExpenseModalProps {
  open: boolean;
  defaultDate: string;
  editingExpense: Expense | null;
  onClose: () => void;
  onSave: (input: ExpenseInput, editingId?: string) => Promise<void>;
}

export function ExpenseModal({
  open,
  defaultDate,
  editingExpense,
  onClose,
  onSave,
}: ExpenseModalProps) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Dining & Coffee');
  const [date, setDate] = useState(defaultDate);
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingExpense) {
      setMerchant(editingExpense.merchant);
      setAmount(editingExpense.amount.toFixed(2));
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setPaymentMethod(editingExpense.paymentMethod);
      setNote(editingExpense.note);
    } else {
      setMerchant('');
      setAmount('');
      setCategory('Dining & Coffee');
      setDate(defaultDate);
      setPaymentMethod('Credit Card');
      setNote('');
    }
    setErrors({});
    setSubmitError(null);
  }, [open, editingExpense, defaultDate]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    const payload: ExpenseInput = {
      merchant,
      amount: numericAmount,
      category,
      date,
      paymentMethod,
      note,
    };

    const validation = validateExpenseInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSave(payload, editingExpense?.id);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 id="expense-modal-title" className="text-lg font-semibold text-slate-50">
            {editingExpense ? 'Edit Expense' : 'Log Daily Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close expense dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-300"
            >
              {submitError}
            </div>
          )}

          <div>
            <label
              htmlFor="expense-merchant"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Merchant or Description
            </label>
            <input
              id="expense-merchant"
              type="text"
              autoFocus
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Blue Bottle Coffee, Trader Joes"
              className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            {errors.merchant && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {errors.merchant}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="expense-amount"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Amount (INR)
              </label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 font-mono tabular-nums placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  {errors.amount}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="expense-date"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="expense-category"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="expense-payment"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Payment Method
              </label>
              <select
                id="expense-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  {errors.paymentMethod}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="expense-note"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Note (Optional)
            </label>
            <input
              id="expense-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for monthly budget review"
              className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            {errors.note && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {errors.note}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-slate-700 bg-slate-800 text-sm font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-4 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 whitespace-nowrap"
            >
              {submitting
                ? 'Saving...'
                : editingExpense
                  ? 'Save Changes'
                  : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
