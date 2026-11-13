export type BudgetStatus = 'nominal' | 'warning' | 'over';

export interface CategoryMeta {
  id: string;
  label: string;
  defaultBudget: number;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'Housing', label: 'Housing', defaultBudget: 1850, color: '#0f172a' },
  { id: 'Groceries', label: 'Groceries', defaultBudget: 550, color: '#059669' },
  { id: 'Dining & Coffee', label: 'Dining & Coffee', defaultBudget: 320, color: '#0d9488' },
  { id: 'Transport', label: 'Transport', defaultBudget: 240, color: '#2563eb' },
  { id: 'Utilities', label: 'Utilities', defaultBudget: 190, color: '#475569' },
  { id: 'Health & Fitness', label: 'Health & Fitness', defaultBudget: 160, color: '#16a34a' },
  { id: 'Subscriptions', label: 'Subscriptions', defaultBudget: 95, color: '#6366f1' },
  { id: 'Shopping', label: 'Shopping', defaultBudget: 280, color: '#d97706' },
  { id: 'Entertainment', label: 'Entertainment', defaultBudget: 150, color: '#64748b' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const PAYMENT_METHODS = [
  'Debit Card',
  'Credit Card',
  'Apple Pay',
  'Bank Transfer',
  'Cash',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Expense {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  note: string;
  createdAt: string;
}

export interface ExpenseInput {
  merchant: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
}

export interface CategoryBreakdown {
  category: string;
  color: string;
  spent: number;
  budget: number;
  remaining: number;
  utilizationPct: number;
  status: BudgetStatus;
  transactionCount: number;
}

export interface DailyPoint {
  date: string;
  day: number;
  total: number;
  cumulative: number;
  count: number;
}

export interface MonthlySummary {
  monthKey: string;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  utilizationPct: number;
  status: BudgetStatus;
  transactionCount: number;
  daysElapsed: number;
  daysInMonth: number;
  dailyAverage: number;
  projectedMonthEnd: number;
  previousMonthTotal: number;
  monthOverMonthPct: number | null;
  topMerchant: { merchant: string; total: number } | null;
  peakDay: { date: string; total: number } | null;
}

export interface ExpenseFilters {
  search?: string;
  category?: string;
  paymentMethod?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface AiAlertItem {
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AiRecommendationItem {
  title: string;
  action: string;
  estimatedMonthlySavings: number;
  category: string;
}

export interface AiInsightReport {
  monthKey: string;
  generatedAt: string;
  source: 'gemini' | 'analytical';
  headline: string;
  summary: string;
  paceAssessment: string;
  topCategoryObservation: string;
  alerts: AiAlertItem[];
  recommendations: AiRecommendationItem[];
}

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatCompactCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 30;
  }
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return monthKey;
  }
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return monthKey;
  }
  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function validateExpenseInput(input: Partial<ExpenseInput>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const merchant = (input.merchant ?? '').trim();
  if (!merchant) {
    errors.merchant = 'Merchant or description is required.';
  } else if (merchant.length > 80) {
    errors.merchant = 'Merchant name must be 80 characters or fewer.';
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Enter a valid amount greater than ₹0.00.';
  } else if (amount > 10000000) {
    errors.amount = 'Amount cannot exceed ₹1,00,00,000.';
  }

  const category = (input.category ?? '').trim();
  if (!category || !CATEGORY_IDS.includes(category)) {
    errors.category = 'Select a valid spending category.';
  }

  const date = (input.date ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = 'Enter a valid date (YYYY-MM-DD).';
  } else {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      errors.date = 'Enter a real calendar date.';
    }
  }

  const paymentMethod = (input.paymentMethod ?? '').trim();
  if (!paymentMethod || !(PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    errors.paymentMethod = 'Select a valid payment method.';
  }

  if (input.note && input.note.trim().length > 200) {
    errors.note = 'Note must be 200 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBudgetAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < 0) {
    return 'Budget must be ₹0 or greater.';
  }
  if (amount > 10000000) {
    return 'Budget cannot exceed ₹1,00,00,000.';
  }
  return null;
}

export function computeBudgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) {
    return spent > 0 ? 'over' : 'nominal';
  }
  const ratio = spent / limit;
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'nominal';
}

export function computeDailySeries(expenses: Expense[], monthKey: string): DailyPoint[] {
  const daysInMonth = getDaysInMonth(monthKey);
  const byDay = new Map<number, { total: number; count: number }>();

  for (const exp of expenses) {
    if (getMonthKey(exp.date) !== monthKey) continue;
    const day = Number(exp.date.slice(8, 10));
    const current = byDay.get(day) ?? { total: 0, count: 0 };
    byDay.set(day, {
      total: Math.round((current.total + exp.amount) * 100) / 100,
      count: current.count + 1,
    });
  }

  const points: DailyPoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const entry = byDay.get(day) ?? { total: 0, count: 0 };
    cumulative = Math.round((cumulative + entry.total) * 100) / 100;
    points.push({
      date: `${monthKey}-${String(day).padStart(2, '0')}`,
      day,
      total: entry.total,
      cumulative,
      count: entry.count,
    });
  }
  return points;
}

export function computeCategoryBreakdown(
  expenses: Expense[],
  budgets: Record<string, number>,
  monthKey: string
): CategoryBreakdown[] {
  const spentByCategory = new Map<string, { spent: number; count: number }>();

  for (const exp of expenses) {
    if (getMonthKey(exp.date) !== monthKey) continue;
    const prev = spentByCategory.get(exp.category) ?? { spent: 0, count: 0 };
    spentByCategory.set(exp.category, {
      spent: Math.round((prev.spent + exp.amount) * 100) / 100,
      count: prev.count + 1,
    });
  }

  return CATEGORIES.map((cat) => {
    const record = spentByCategory.get(cat.id) ?? { spent: 0, count: 0 };
    const budget = budgets[cat.id] ?? cat.defaultBudget;
    const remaining = Math.round((budget - record.spent) * 100) / 100;
    const utilizationPct =
      budget > 0 ? Math.round((record.spent / budget) * 1000) / 10 : record.spent > 0 ? 100 : 0;

    return {
      category: cat.id,
      color: cat.color,
      spent: record.spent,
      budget,
      remaining,
      utilizationPct,
      status: computeBudgetStatus(record.spent, budget),
      transactionCount: record.count,
    };
  }).sort((a, b) => b.spent - a.spent || b.budget - a.budget);
}

export function computeMonthlySummary(
  expenses: Expense[],
  budgets: Record<string, number>,
  monthKey: string,
  previousMonthTotal = 0,
  referenceDate = '2026-11-13'
): MonthlySummary {
  const monthExpenses = expenses.filter((e) => getMonthKey(e.date) === monthKey);
  const totalSpent =
    Math.round(monthExpenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

  const totalBudget =
    Math.round(
      CATEGORIES.reduce((sum, cat) => sum + (budgets[cat.id] ?? cat.defaultBudget), 0) * 100
    ) / 100;

  const remainingBudget = Math.round((totalBudget - totalSpent) * 100) / 100;
  const utilizationPct =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

  const daysInMonth = getDaysInMonth(monthKey);
  const refMonth = getMonthKey(referenceDate);
  let daysElapsed = daysInMonth;
  if (monthKey === refMonth) {
    daysElapsed = Math.max(1, Math.min(daysInMonth, Number(referenceDate.slice(8, 10))));
  } else if (monthKey > refMonth) {
    daysElapsed = 1;
  }

  const dailyAverage =
    monthExpenses.length > 0 ? Math.round((totalSpent / daysElapsed) * 100) / 100 : 0;
  const projectedMonthEnd = Math.round(dailyAverage * daysInMonth * 100) / 100;

  const monthOverMonthPct =
    previousMonthTotal > 0
      ? Math.round(((totalSpent - previousMonthTotal) / previousMonthTotal) * 1000) / 10
      : null;

  const merchantTotals = new Map<string, number>();
  const dayTotals = new Map<string, number>();

  for (const exp of monthExpenses) {
    merchantTotals.set(
      exp.merchant,
      Math.round(((merchantTotals.get(exp.merchant) ?? 0) + exp.amount) * 100) / 100
    );
    dayTotals.set(
      exp.date,
      Math.round(((dayTotals.get(exp.date) ?? 0) + exp.amount) * 100) / 100
    );
  }

  let topMerchant: { merchant: string; total: number } | null = null;
  for (const [merchant, total] of merchantTotals.entries()) {
    if (!topMerchant || total > topMerchant.total) {
      topMerchant = { merchant, total };
    }
  }

  let peakDay: { date: string; total: number } | null = null;
  for (const [date, total] of dayTotals.entries()) {
    if (!peakDay || total > peakDay.total) {
      peakDay = { date, total };
    }
  }

  return {
    monthKey,
    totalSpent,
    totalBudget,
    remainingBudget,
    utilizationPct,
    status: computeBudgetStatus(totalSpent, totalBudget),
    transactionCount: monthExpenses.length,
    daysElapsed,
    daysInMonth,
    dailyAverage,
    projectedMonthEnd,
    previousMonthTotal,
    monthOverMonthPct,
    topMerchant,
    peakDay,
  };
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const search = (filters.search ?? '').trim().toLowerCase();
  const category = filters.category && filters.category !== 'All' ? filters.category : null;
  const paymentMethod =
    filters.paymentMethod && filters.paymentMethod !== 'All' ? filters.paymentMethod : null;

  const filtered = expenses.filter((exp) => {
    if (category && exp.category !== category) return false;
    if (paymentMethod && exp.paymentMethod !== paymentMethod) return false;
    if (search) {
      const haystack = `${exp.merchant} ${exp.category} ${exp.note} ${exp.paymentMethod}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sortBy = filters.sortBy ?? 'date_desc';
  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
      case 'amount_desc':
        return b.amount - a.amount || b.date.localeCompare(a.date);
      case 'amount_asc':
        return a.amount - b.amount || b.date.localeCompare(a.date);
      case 'date_desc':
      default:
        return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    }
  });
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function expensesToCsv(expenses: Expense[]): string {
  const header = ['Date', 'Merchant', 'Category', 'Amount', 'Payment Method', 'Note'].join(',');
  const rows = expenses.map((exp) =>
    [
      escapeCsvCell(exp.date),
      escapeCsvCell(exp.merchant),
      escapeCsvCell(exp.category),
      escapeCsvCell(exp.amount.toFixed(2)),
      escapeCsvCell(exp.paymentMethod),
      escapeCsvCell(exp.note),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export const SAVINGS_POTS = [
  'Emergency Fund',
  'Investments & SIP',
  'Travel & Goals',
  'Spare Change Jar',
  'Home & Big Purchases',
] as const;

export type SavingsPot = (typeof SAVINGS_POTS)[number];

export const DEFAULT_MONTHLY_SAVINGS_TARGET = 4000;

export interface SavingsEntry {
  id: string;
  title: string;
  pot: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: string;
}

export interface SavingsEntryInput {
  title: string;
  pot: string;
  amount: number;
  date: string;
  note?: string;
}

export interface SavingsSummary {
  totalSaved: number;
  totalCount: number;
  monthSaved: number;
  monthCount: number;
  monthlyTarget: number;
  targetProgressPct: number;
  remainingToTarget: number;
  averageDeposit: number;
  topPot: { pot: string; total: number } | null;
}

export function validateSavingsInput(input: Partial<SavingsEntryInput>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const title = (input.title ?? '').trim();
  if (!title) {
    errors.title = 'Deposit title or source is required.';
  } else if (title.length > 80) {
    errors.title = 'Title must be 80 characters or fewer.';
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Enter a valid amount greater than ₹0.00.';
  } else if (amount > 10000000) {
    errors.amount = 'Amount cannot exceed ₹1,00,00,000.';
  }

  const pot = (input.pot ?? '').trim();
  if (!pot || !(SAVINGS_POTS as readonly string[]).includes(pot)) {
    errors.pot = 'Select a valid savings pot.';
  }

  const date = (input.date ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = 'Enter a valid date (YYYY-MM-DD).';
  } else {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      errors.date = 'Enter a real calendar date.';
    }
  }

  if (input.note && input.note.trim().length > 200) {
    errors.note = 'Note must be 200 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSavingsTarget(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < 0) {
    return 'Savings target must be ₹0 or greater.';
  }
  if (amount > 10000000) {
    return 'Savings target cannot exceed ₹1,00,00,000.';
  }
  return null;
}

export function computeSavingsSummary(
  entries: SavingsEntry[],
  monthKey: string,
  monthlyTarget = DEFAULT_MONTHLY_SAVINGS_TARGET
): SavingsSummary {
  const totalSaved =
    Math.round(entries.reduce((sum, entry) => sum + entry.amount, 0) * 100) / 100;
  const totalCount = entries.length;

  const monthEntries = entries.filter((entry) => getMonthKey(entry.date) === monthKey);
  const monthSaved =
    Math.round(monthEntries.reduce((sum, entry) => sum + entry.amount, 0) * 100) / 100;
  const monthCount = monthEntries.length;

  const safeTarget = Math.max(0, Math.round(monthlyTarget * 100) / 100);
  const targetProgressPct =
    safeTarget > 0 ? Math.round((monthSaved / safeTarget) * 1000) / 10 : monthSaved > 0 ? 100 : 0;
  const remainingToTarget = Math.max(0, Math.round((safeTarget - monthSaved) * 100) / 100);
  const averageDeposit =
    totalCount > 0 ? Math.round((totalSaved / totalCount) * 100) / 100 : 0;

  const potTotals = new Map<string, number>();
  for (const entry of entries) {
    potTotals.set(
      entry.pot,
      Math.round(((potTotals.get(entry.pot) ?? 0) + entry.amount) * 100) / 100
    );
  }

  let topPot: { pot: string; total: number } | null = null;
  for (const [pot, total] of potTotals.entries()) {
    if (!topPot || total > topPot.total) {
      topPot = { pot, total };
    }
  }

  return {
    totalSaved,
    totalCount,
    monthSaved,
    monthCount,
    monthlyTarget: safeTarget,
    targetProgressPct,
    remainingToTarget,
    averageDeposit,
    topPot,
  };
}

