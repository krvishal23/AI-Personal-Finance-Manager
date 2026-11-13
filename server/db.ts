import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  CATEGORIES,
  DEFAULT_MONTHLY_SAVINGS_TARGET,
  getMonthKey,
  getPreviousMonthKey,
  type AiInsightReport,
  type Expense,
  type ExpenseInput,
  type SavingsEntry,
  type SavingsEntryInput,
} from '../src/shared/finance.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'ledgerly.db');

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      month_key TEXT NOT NULL,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      PRIMARY KEY (month_key, category)
    );

    CREATE TABLE IF NOT EXISTS ai_insights_cache (
      month_key TEXT PRIMARY KEY,
      report_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      pot TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_targets (
      month_key TEXT PRIMARY KEY,
      target_amount REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_savings_date ON savings_entries(date);
  `);

  seedInitialDataIfEmpty(db);
  seedSavingsIfEmpty(db);
  dbInstance = db;
  return db;
}

function seedInitialDataIfEmpty(db: DatabaseSync): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM expenses').get() as {
    count: number;
  };
  if (countRow.count > 0) return;

  const seedExpenses: Array<Omit<Expense, 'id' | 'createdAt'>> = [
    // November 2026 (Current Month up to 2026-11-13)
    {
      merchant: 'Oakridge Residences',
      category: 'Housing',
      amount: 1850.0,
      date: '2026-11-01',
      paymentMethod: 'Bank Transfer',
      note: 'Monthly apartment rent',
    },
    {
      merchant: 'Trader Joes',
      category: 'Groceries',
      amount: 124.65,
      date: '2026-11-02',
      paymentMethod: 'Credit Card',
      note: 'Weekly produce and pantry essentials',
    },
    {
      merchant: 'ConEdison Electric',
      category: 'Utilities',
      amount: 112.4,
      date: '2026-11-03',
      paymentMethod: 'Bank Transfer',
      note: 'Monthly electric bill',
    },
    {
      merchant: 'Blue Bottle Coffee',
      category: 'Dining & Coffee',
      amount: 13.75,
      date: '2026-11-03',
      paymentMethod: 'Apple Pay',
      note: 'Oat latte & croissant',
    },
    {
      merchant: 'Equinox Club',
      category: 'Health & Fitness',
      amount: 135.0,
      date: '2026-11-04',
      paymentMethod: 'Credit Card',
      note: 'Monthly gym membership',
    },
    {
      merchant: 'Metro Transit Pass',
      category: 'Transport',
      amount: 68.0,
      date: '2026-11-05',
      paymentMethod: 'Debit Card',
      note: 'Commuter reload',
    },
    {
      merchant: 'Sweetgreen',
      category: 'Dining & Coffee',
      amount: 19.45,
      date: '2026-11-05',
      paymentMethod: 'Apple Pay',
      note: 'Harvest bowl lunch',
    },
    {
      merchant: 'Spotify & iCloud+',
      category: 'Subscriptions',
      amount: 24.98,
      date: '2026-11-06',
      paymentMethod: 'Credit Card',
      note: 'Monthly digital subscriptions',
    },
    {
      merchant: 'Whole Foods Market',
      category: 'Groceries',
      amount: 158.3,
      date: '2026-11-07',
      paymentMethod: 'Credit Card',
      note: 'Weekend dinner prep & fresh fish',
    },
    {
      merchant: 'Osteria Mozza',
      category: 'Dining & Coffee',
      amount: 118.5,
      date: '2026-11-07',
      paymentMethod: 'Credit Card',
      note: 'Saturday dinner with friends',
    },
    {
      merchant: 'Uniqlo',
      category: 'Shopping',
      amount: 146.8,
      date: '2026-11-08',
      paymentMethod: 'Apple Pay',
      note: 'Merino sweater & winter layers',
    },
    {
      merchant: 'Fiber Home Internet',
      category: 'Utilities',
      amount: 75.0,
      date: '2026-11-09',
      paymentMethod: 'Bank Transfer',
      note: 'Gigabit fiber plan',
    },
    {
      merchant: 'Uber',
      category: 'Transport',
      amount: 34.2,
      date: '2026-11-09',
      paymentMethod: 'Apple Pay',
      note: 'Late evening ride home',
    },
    {
      merchant: 'NYTimes & Substack',
      category: 'Subscriptions',
      amount: 27.0,
      date: '2026-11-10',
      paymentMethod: 'Credit Card',
      note: 'News & finance newsletters',
    },
    {
      merchant: 'Ramen Nagi',
      category: 'Dining & Coffee',
      amount: 46.9,
      date: '2026-11-10',
      paymentMethod: 'Credit Card',
      note: 'Quick weeknight dinner',
    },
    {
      merchant: 'CVS Pharmacy',
      category: 'Health & Fitness',
      amount: 28.4,
      date: '2026-11-11',
      paymentMethod: 'Debit Card',
      note: 'Vitamins and cold brew',
    },
    {
      merchant: 'Trader Joes',
      category: 'Groceries',
      amount: 112.15,
      date: '2026-11-11',
      paymentMethod: 'Credit Card',
      note: 'Mid-week restock',
    },
    {
      merchant: 'Alamo Drafthouse',
      category: 'Entertainment',
      amount: 44.5,
      date: '2026-11-12',
      paymentMethod: 'Credit Card',
      note: 'Evening cinema tickets',
    },
    {
      merchant: 'Sightglass Coffee',
      category: 'Dining & Coffee',
      amount: 11.2,
      date: '2026-11-12',
      paymentMethod: 'Apple Pay',
      note: 'Afternoon cortado',
    },
    {
      merchant: 'Apple Store',
      category: 'Shopping',
      amount: 149.0,
      date: '2026-11-13',
      paymentMethod: 'Credit Card',
      note: 'USB-C hub and braided cable',
    },

    // October 2026 (Historical comparison month)
    {
      merchant: 'Oakridge Residences',
      category: 'Housing',
      amount: 1850.0,
      date: '2026-10-01',
      paymentMethod: 'Bank Transfer',
      note: 'October apartment rent',
    },
    {
      merchant: 'Whole Foods Market',
      category: 'Groceries',
      amount: 172.4,
      date: '2026-10-03',
      paymentMethod: 'Credit Card',
      note: 'Weekly groceries',
    },
    {
      merchant: 'ConEdison Electric',
      category: 'Utilities',
      amount: 104.8,
      date: '2026-10-04',
      paymentMethod: 'Bank Transfer',
      note: 'Electric utility',
    },
    {
      merchant: 'Equinox Club',
      category: 'Health & Fitness',
      amount: 135.0,
      date: '2026-10-04',
      paymentMethod: 'Credit Card',
      note: 'Monthly membership',
    },
    {
      merchant: 'Fiber Home Internet',
      category: 'Utilities',
      amount: 75.0,
      date: '2026-10-09',
      paymentMethod: 'Bank Transfer',
      note: 'Gigabit fiber plan',
    },
    {
      merchant: 'Trader Joes',
      category: 'Groceries',
      amount: 134.9,
      date: '2026-10-10',
      paymentMethod: 'Credit Card',
      note: 'Pantry & produce',
    },
    {
      merchant: 'Spotify & iCloud+',
      category: 'Subscriptions',
      amount: 24.98,
      date: '2026-10-06',
      paymentMethod: 'Credit Card',
      note: 'Subscriptions',
    },
    {
      merchant: 'Blue Bottle Coffee',
      category: 'Dining & Coffee',
      amount: 38.6,
      date: '2026-10-12',
      paymentMethod: 'Apple Pay',
      note: 'Coffee runs & beans',
    },
    {
      merchant: 'Metro Transit Pass',
      category: 'Transport',
      amount: 82.5,
      date: '2026-10-14',
      paymentMethod: 'Debit Card',
      note: 'Transit + weekend rail',
    },
    {
      merchant: 'Bistro Jeanty',
      category: 'Dining & Coffee',
      amount: 134.2,
      date: '2026-10-17',
      paymentMethod: 'Credit Card',
      note: 'Anniversary dinner',
    },
    {
      merchant: 'Whole Foods Market',
      category: 'Groceries',
      amount: 164.1,
      date: '2026-10-19',
      paymentMethod: 'Credit Card',
      note: 'Weekly groceries',
    },
    {
      merchant: 'NYTimes & Substack',
      category: 'Subscriptions',
      amount: 27.0,
      date: '2026-10-10',
      paymentMethod: 'Credit Card',
      note: 'News subscriptions',
    },
    {
      merchant: 'Patagonia',
      category: 'Shopping',
      amount: 189.0,
      date: '2026-10-22',
      paymentMethod: 'Credit Card',
      note: 'Rain shell jacket',
    },
    {
      merchant: 'AMC Theatres',
      category: 'Entertainment',
      amount: 52.0,
      date: '2026-10-25',
      paymentMethod: 'Apple Pay',
      note: 'IMAX screening & snacks',
    },
    {
      merchant: 'Trader Joes',
      category: 'Groceries',
      amount: 109.85,
      date: '2026-10-27',
      paymentMethod: 'Credit Card',
      note: 'Late month groceries',
    },
    {
      merchant: 'Uber',
      category: 'Transport',
      amount: 61.4,
      date: '2026-10-29',
      paymentMethod: 'Apple Pay',
      note: 'Airport drop-off',
    },
  ];

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, merchant, category, amount, date, payment_method, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    seedExpenses.forEach((item, idx) => {
      const id = crypto.randomUUID();
      const createdAt = `${item.date}T12:${String(idx % 60).padStart(2, '0')}:00.000Z`;
      insertExpense.run(
        id,
        item.merchant,
        item.category,
        item.amount,
        item.date,
        item.paymentMethod,
        item.note,
        createdAt
      );
    });

    const insertBudget = db.prepare(`
      INSERT INTO budgets (month_key, category, limit_amount)
      VALUES (?, ?, ?)
    `);
    for (const monthKey of ['2026-10', '2026-11']) {
      for (const cat of CATEGORIES) {
        insertBudget.run(monthKey, cat.id, cat.defaultBudget);
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function seedSavingsIfEmpty(db: DatabaseSync): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM savings_entries').get() as {
    count: number;
  };
  if (countRow.count > 0) return;

  const seedSavings: Array<Omit<SavingsEntry, 'id' | 'createdAt'>> = [
    {
      title: 'Emergency Reserve Transfer',
      pot: 'Emergency Fund',
      amount: 1200,
      date: '2026-11-01',
      note: 'Automated start-of-month buffer',
    },
    {
      title: 'Nifty 50 Index SIP',
      pot: 'Investments & SIP',
      amount: 1500,
      date: '2026-11-05',
      note: 'Monthly systematic investment',
    },
    {
      title: 'Weekend Spare Change',
      pot: 'Spare Change Jar',
      amount: 350,
      date: '2026-11-09',
      note: 'Round-up cash sweep into Gullak',
    },
    {
      title: 'Goa Trip Reserve',
      pot: 'Travel & Goals',
      amount: 600,
      date: '2026-11-12',
      note: 'Mid-month travel pot contribution',
    },
    {
      title: 'Emergency Reserve Transfer',
      pot: 'Emergency Fund',
      amount: 1200,
      date: '2026-10-01',
      note: 'October automated buffer',
    },
    {
      title: 'Nifty 50 Index SIP',
      pot: 'Investments & SIP',
      amount: 1500,
      date: '2026-10-05',
      note: 'October monthly SIP',
    },
    {
      title: 'Festive Budget Surplus',
      pot: 'Spare Change Jar',
      amount: 450,
      date: '2026-10-25',
      note: 'Unspent dining allowance moved to savings',
    },
  ];

  const insertSavings = db.prepare(`
    INSERT INTO savings_entries (id, title, pot, amount, date, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTarget = db.prepare(`
    INSERT OR IGNORE INTO savings_targets (month_key, target_amount)
    VALUES (?, ?)
  `);

  db.exec('BEGIN');
  try {
    seedSavings.forEach((item, idx) => {
      const id = crypto.randomUUID();
      const createdAt = `${item.date}T10:${String(idx % 60).padStart(2, '0')}:00.000Z`;
      insertSavings.run(
        id,
        item.title,
        item.pot,
        item.amount,
        item.date,
        item.note,
        createdAt
      );
    });

    insertTarget.run('2026-10', DEFAULT_MONTHLY_SAVINGS_TARGET);
    insertTarget.run('2026-11', DEFAULT_MONTHLY_SAVINGS_TARGET);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function mapExpenseRow(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    merchant: String(row.merchant),
    category: String(row.category),
    amount: Number(row.amount),
    date: String(row.date),
    paymentMethod: String(row.payment_method),
    note: String(row.note ?? ''),
    createdAt: String(row.created_at),
  };
}

function mapSavingsRow(row: Record<string, unknown>): SavingsEntry {
  return {
    id: String(row.id),
    title: String(row.title),
    pot: String(row.pot),
    amount: Number(row.amount),
    date: String(row.date),
    note: String(row.note ?? ''),
    createdAt: String(row.created_at),
  };
}

export function listAvailableMonths(): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT DISTINCT substr(date, 1, 7) AS month_key FROM expenses
      UNION
      SELECT DISTINCT month_key FROM budgets
      UNION
      SELECT DISTINCT substr(date, 1, 7) AS month_key FROM savings_entries
      ORDER BY month_key DESC
      `
    )
    .all() as Array<{ month_key: string }>;

  const months = new Set(rows.map((r) => r.month_key));
  months.add('2026-11');
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export function listExpensesByMonth(monthKey: string): Expense[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, merchant, category, amount, date, payment_method, note, created_at
      FROM expenses
      WHERE substr(date, 1, 7) = ?
      ORDER BY date DESC, created_at DESC
      `
    )
    .all(monthKey) as Array<Record<string, unknown>>;

  return rows.map(mapExpenseRow);
}

export function getMonthTotal(monthKey: string): number {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE substr(date, 1, 7) = ?
      `
    )
    .get(monthKey) as { total: number };
  return Math.round(Number(row.total) * 100) / 100;
}

export function getBudgetsForMonth(monthKey: string): Record<string, number> {
  const db = getDb();
  const rows = db
    .prepare('SELECT category, limit_amount FROM budgets WHERE month_key = ?')
    .all(monthKey) as Array<{ category: string; limit_amount: number }>;

  const result: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    result[cat.id] = cat.defaultBudget;
  }
  for (const row of rows) {
    result[row.category] = Number(row.limit_amount);
  }
  return result;
}

export function upsertBudgetForMonth(
  monthKey: string,
  category: string,
  limitAmount: number
): Record<string, number> {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO budgets (month_key, category, limit_amount)
    VALUES (?, ?, ?)
    ON CONFLICT(month_key, category)
    DO UPDATE SET limit_amount = excluded.limit_amount
    `
  ).run(monthKey, category, Math.round(limitAmount * 100) / 100);

  db.prepare('DELETE FROM ai_insights_cache WHERE month_key = ?').run(monthKey);
  return getBudgetsForMonth(monthKey);
}

export function createExpense(input: ExpenseInput): Expense {
  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const amount = Math.round(Number(input.amount) * 100) / 100;
  const note = (input.note ?? '').trim();

  db.prepare(
    `
    INSERT INTO expenses (id, merchant, category, amount, date, payment_method, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    input.merchant.trim(),
    input.category.trim(),
    amount,
    input.date.trim(),
    input.paymentMethod.trim(),
    note,
    createdAt
  );

  const monthKey = getMonthKey(input.date.trim());
  db.prepare('DELETE FROM ai_insights_cache WHERE month_key = ?').run(monthKey);

  return {
    id,
    merchant: input.merchant.trim(),
    category: input.category.trim(),
    amount,
    date: input.date.trim(),
    paymentMethod: input.paymentMethod.trim(),
    note,
    createdAt,
  };
}

export function updateExpense(id: string, input: ExpenseInput): Expense | null {
  const db = getDb();
  const existing = db
    .prepare('SELECT id, created_at FROM expenses WHERE id = ?')
    .get(id) as { id: string; created_at: string } | undefined;

  if (!existing) return null;

  const amount = Math.round(Number(input.amount) * 100) / 100;
  const note = (input.note ?? '').trim();

  db.prepare(
    `
    UPDATE expenses
    SET merchant = ?, category = ?, amount = ?, date = ?, payment_method = ?, note = ?
    WHERE id = ?
    `
  ).run(
    input.merchant.trim(),
    input.category.trim(),
    amount,
    input.date.trim(),
    input.paymentMethod.trim(),
    note,
    id
  );

  const monthKey = getMonthKey(input.date.trim());
  db.prepare('DELETE FROM ai_insights_cache WHERE month_key = ?').run(monthKey);

  return {
    id,
    merchant: input.merchant.trim(),
    category: input.category.trim(),
    amount,
    date: input.date.trim(),
    paymentMethod: input.paymentMethod.trim(),
    note,
    createdAt: existing.created_at,
  };
}

export function deleteExpense(id: string): boolean {
  const db = getDb();
  const existing = db
    .prepare('SELECT date FROM expenses WHERE id = ?')
    .get(id) as { date: string } | undefined;
  if (!existing) return false;

  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  const monthKey = getMonthKey(existing.date);
  db.prepare('DELETE FROM ai_insights_cache WHERE month_key = ?').run(monthKey);
  return true;
}

export function getCachedAiInsight(monthKey: string): AiInsightReport | null {
  const db = getDb();
  const row = db
    .prepare('SELECT report_json FROM ai_insights_cache WHERE month_key = ?')
    .get(monthKey) as { report_json: string } | undefined;

  if (!row) return null;
  if (row.report_json.includes('$')) {
    db.prepare('DELETE FROM ai_insights_cache WHERE month_key = ?').run(monthKey);
    return null;
  }
  try {
    return JSON.parse(row.report_json) as AiInsightReport;
  } catch {
    return null;
  }
}

export function saveCachedAiInsight(monthKey: string, report: AiInsightReport): void {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO ai_insights_cache (month_key, report_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(month_key)
    DO UPDATE SET report_json = excluded.report_json, updated_at = excluded.updated_at
    `
  ).run(monthKey, JSON.stringify(report), new Date().toISOString());
}

export function listAllSavings(): SavingsEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, title, pot, amount, date, note, created_at
      FROM savings_entries
      ORDER BY date DESC, created_at DESC
      `
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map(mapSavingsRow);
}

export function getSavingsTargetForMonth(monthKey: string): number {
  const db = getDb();
  const row = db
    .prepare('SELECT target_amount FROM savings_targets WHERE month_key = ?')
    .get(monthKey) as { target_amount: number } | undefined;
  return row ? Number(row.target_amount) : DEFAULT_MONTHLY_SAVINGS_TARGET;
}

export function upsertSavingsTargetForMonth(monthKey: string, targetAmount: number): number {
  const db = getDb();
  const rounded = Math.round(targetAmount * 100) / 100;
  db.prepare(
    `
    INSERT INTO savings_targets (month_key, target_amount)
    VALUES (?, ?)
    ON CONFLICT(month_key)
    DO UPDATE SET target_amount = excluded.target_amount
    `
  ).run(monthKey, rounded);
  return rounded;
}

export function createSavingsEntry(input: SavingsEntryInput): SavingsEntry {
  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const amount = Math.round(Number(input.amount) * 100) / 100;
  const note = (input.note ?? '').trim();

  db.prepare(
    `
    INSERT INTO savings_entries (id, title, pot, amount, date, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    input.title.trim(),
    input.pot.trim(),
    amount,
    input.date.trim(),
    note,
    createdAt
  );

  return {
    id,
    title: input.title.trim(),
    pot: input.pot.trim(),
    amount,
    date: input.date.trim(),
    note,
    createdAt,
  };
}

export function deleteSavingsEntry(id: string): boolean {
  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM savings_entries WHERE id = ?')
    .get(id) as { id: string } | undefined;
  if (!existing) return false;
  db.prepare('DELETE FROM savings_entries WHERE id = ?').run(id);
  return true;
}

export function getDashboardSnapshot(monthKey: string) {
  const expenses = listExpensesByMonth(monthKey);
  const budgets = getBudgetsForMonth(monthKey);
  const previousMonthKey = getPreviousMonthKey(monthKey);
  const previousMonthTotal = getMonthTotal(previousMonthKey);
  const cachedInsight = getCachedAiInsight(monthKey);
  const allSavings = listAllSavings();
  const savingsTarget = getSavingsTargetForMonth(monthKey);

  return {
    monthKey,
    expenses,
    budgets,
    previousMonthTotal,
    cachedInsight,
    allSavings,
    savingsTarget,
  };
}
