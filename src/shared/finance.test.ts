import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBudgetStatus,
  computeCategoryBreakdown,
  computeDailySeries,
  computeMonthlySummary,
  computeSavingsSummary,
  expensesToCsv,
  filterExpenses,
  formatMonthLabel,
  getDaysInMonth,
  getPreviousMonthKey,
  validateBudgetAmount,
  validateExpenseInput,
  validateSavingsInput,
  validateSavingsTarget,
  type Expense,
  type SavingsEntry,
} from './finance';

const SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'e1',
    merchant: 'Whole Foods Market',
    category: 'Groceries',
    amount: 142.5,
    date: '2026-11-04',
    paymentMethod: 'Credit Card',
    note: 'Weekly groceries',
    createdAt: '2026-11-04T12:00:00Z',
  },
  {
    id: 'e2',
    merchant: 'Blue Bottle Coffee',
    category: 'Dining & Coffee',
    amount: 14.25,
    date: '2026-11-04',
    paymentMethod: 'Apple Pay',
    note: 'Latte and pastry',
    createdAt: '2026-11-04T09:00:00Z',
  },
  {
    id: 'e3',
    merchant: 'Oakridge Apartments',
    category: 'Housing',
    amount: 1850,
    date: '2026-11-01',
    paymentMethod: 'Bank Transfer',
    note: 'November rent',
    createdAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'e4',
    merchant: 'Trader Joes',
    category: 'Groceries',
    amount: 95.75,
    date: '2026-10-20',
    paymentMethod: 'Debit Card',
    note: 'October pantry',
    createdAt: '2026-10-20T17:00:00Z',
  },
];

test('validateExpenseInput rejects empty merchant, invalid amount, and bad date', () => {
  const res = validateExpenseInput({
    merchant: '   ',
    amount: -5,
    category: 'Unknown',
    date: '2026-02-30',
    paymentMethod: 'Crypto',
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors.merchant);
  assert.ok(res.errors.amount);
  assert.ok(res.errors.category);
  assert.ok(res.errors.date);
  assert.ok(res.errors.paymentMethod);
});

test('validateExpenseInput accepts valid expense', () => {
  const res = validateExpenseInput({
    merchant: 'Blue Bottle Coffee',
    amount: 18.5,
    category: 'Dining & Coffee',
    date: '2026-11-13',
    paymentMethod: 'Apple Pay',
    note: 'Morning meeting',
  });
  assert.equal(res.valid, true);
  assert.deepEqual(res.errors, {});
});

test('validateBudgetAmount catches negative values', () => {
  assert.equal(validateBudgetAmount(500), null);
  assert.ok(validateBudgetAmount(-1));
});

test('computeBudgetStatus classifies nominal, warning (>=80%), and over (>100%)', () => {
  assert.equal(computeBudgetStatus(400, 500), 'warning');
  assert.equal(computeBudgetStatus(399, 500), 'nominal');
  assert.equal(computeBudgetStatus(501, 500), 'over');
  assert.equal(computeBudgetStatus(10, 0), 'over');
});

test('getDaysInMonth and getPreviousMonthKey handle calendar boundaries', () => {
  assert.equal(getDaysInMonth('2026-11'), 30);
  assert.equal(getDaysInMonth('2024-02'), 29);
  assert.equal(getPreviousMonthKey('2026-01'), '2025-12');
  assert.equal(formatMonthLabel('2026-11'), 'November 2026');
});

test('computeDailySeries accumulates daily spend and cumulative totals', () => {
  const series = computeDailySeries(SAMPLE_EXPENSES, '2026-11');
  assert.equal(series.length, 30);
  assert.equal(series[0].total, 1850);
  assert.equal(series[3].total, 156.75);
  assert.equal(series[3].count, 2);
  assert.equal(series[3].cumulative, 2006.75);
});

test('computeCategoryBreakdown calculates spent, remaining, and utilization', () => {
  const breakdown = computeCategoryBreakdown(
    SAMPLE_EXPENSES,
    { Groceries: 300, Housing: 1850 },
    '2026-11'
  );
  const groceries = breakdown.find((b) => b.category === 'Groceries');
  const housing = breakdown.find((b) => b.category === 'Housing');
  assert.ok(groceries);
  assert.ok(housing);
  assert.equal(groceries.spent, 142.5);
  assert.equal(groceries.remaining, 157.5);
  assert.equal(groceries.status, 'nominal');
  assert.equal(housing.utilizationPct, 100);
  assert.equal(housing.status, 'warning');
});

test('computeMonthlySummary aggregates totals, pace, peak day, and top merchant', () => {
  const summary = computeMonthlySummary(SAMPLE_EXPENSES, {}, '2026-11', 1000, '2026-11-13');
  assert.equal(summary.totalSpent, 2006.75);
  assert.equal(summary.transactionCount, 3);
  assert.equal(summary.daysElapsed, 13);
  assert.equal(summary.topMerchant?.merchant, 'Oakridge Apartments');
  assert.equal(summary.peakDay?.date, '2026-11-01');
  assert.equal(summary.monthOverMonthPct, 100.7);
});

test('filterExpenses filters by search, category, and sorts properly', () => {
  const searched = filterExpenses(SAMPLE_EXPENSES, { search: 'coffee' });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 'e2');

  const sortedByAmount = filterExpenses(SAMPLE_EXPENSES, { sortBy: 'amount_desc' });
  assert.equal(sortedByAmount[0].id, 'e3');
});

test('expensesToCsv escapes commas and quotes correctly', () => {
  const csv = expensesToCsv([
    {
      ...SAMPLE_EXPENSES[0],
      merchant: 'Cafe, "Deluxe"',
    },
  ]);
  assert.ok(csv.includes('"Cafe, ""Deluxe"""'));
});

test('formatCurrency formats values in Indian Rupees', async () => {
  const { formatCurrency, formatCompactCurrency } = await import('./finance');
  assert.equal(formatCurrency(1850), '₹1,850.00');
  assert.equal(formatCompactCurrency(125000), '₹1,25,000');
});

test('validateSavingsInput validates title, amount, pot, and date', () => {
  const bad = validateSavingsInput({
    title: ' ',
    amount: 0,
    pot: 'Invalid Pot',
    date: '2026-11-31',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.title);
  assert.ok(bad.errors.amount);
  assert.ok(bad.errors.pot);
  assert.ok(bad.errors.date);

  const good = validateSavingsInput({
    title: 'Emergency Reserve',
    amount: 1500,
    pot: 'Emergency Fund',
    date: '2026-11-13',
  });
  assert.equal(good.valid, true);
  assert.deepEqual(good.errors, {});
  assert.ok(validateSavingsTarget(-10));
  assert.equal(validateSavingsTarget(4000), null);
});

test('computeSavingsSummary computes all-time count/total, monthly totals, and top pot', () => {
  const entries: SavingsEntry[] = [
    {
      id: 's1',
      title: 'Emergency Reserve',
      pot: 'Emergency Fund',
      amount: 1200,
      date: '2026-11-02',
      note: '',
      createdAt: '2026-11-02T10:00:00Z',
    },
    {
      id: 's2',
      title: 'Index SIP',
      pot: 'Investments & SIP',
      amount: 1800,
      date: '2026-11-05',
      note: '',
      createdAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 's3',
      title: 'October Surplus',
      pot: 'Emergency Fund',
      amount: 1000,
      date: '2026-10-20',
      note: '',
      createdAt: '2026-10-20T10:00:00Z',
    },
  ];
  const summary = computeSavingsSummary(entries, '2026-11', 4000);
  assert.equal(summary.totalSaved, 4000);
  assert.equal(summary.totalCount, 3);
  assert.equal(summary.monthSaved, 3000);
  assert.equal(summary.monthCount, 2);
  assert.equal(summary.targetProgressPct, 75);
  assert.equal(summary.remainingToTarget, 1000);
  assert.equal(summary.topPot?.pot, 'Emergency Fund');
  assert.equal(summary.topPot?.total, 2200);
});

