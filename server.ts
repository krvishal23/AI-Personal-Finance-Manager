import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORY_IDS,
  validateBudgetAmount,
  validateExpenseInput,
  validateSavingsInput,
  validateSavingsTarget,
} from './src/shared/finance.ts';
import {
  createExpense,
  createSavingsEntry,
  deleteExpense,
  deleteSavingsEntry,
  getDashboardSnapshot,
  listAvailableMonths,
  saveCachedAiInsight,
  updateExpense,
  upsertBudgetForMonth,
  upsertSavingsTargetForMonth,
} from './server/db.ts';
import { askFinancialAdvisor, generateMonthlyAiInsights } from './server/ai.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/months', (_req, res) => {
    try {
      const months = listAvailableMonths();
      res.json({ months });
    } catch (err) {
      console.error('GET /api/months error:', err);
      res.status(500).json({ error: 'Failed to load available months.' });
    }
  });

  app.get('/api/dashboard', (req, res) => {
    try {
      const monthParam = typeof req.query.month === 'string' ? req.query.month : '2026-11';
      const monthKey = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : '2026-11';
      const snapshot = getDashboardSnapshot(monthKey);
      const months = listAvailableMonths();
      res.json({ ...snapshot, availableMonths: months });
    } catch (err) {
      console.error('GET /api/dashboard error:', err);
      res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
  });

  app.post('/api/expenses', (req, res) => {
    try {
      const validation = validateExpenseInput(req.body ?? {});
      if (!validation.valid) {
        res.status(400).json({ error: 'Invalid expense details.', errors: validation.errors });
        return;
      }
      const created = createExpense(req.body);
      res.status(201).json({ expense: created });
    } catch (err) {
      console.error('POST /api/expenses error:', err);
      res.status(500).json({ error: 'Failed to save expense.' });
    }
  });

  app.patch('/api/expenses/:id', (req, res) => {
    try {
      const validation = validateExpenseInput(req.body ?? {});
      if (!validation.valid) {
        res.status(400).json({ error: 'Invalid expense details.', errors: validation.errors });
        return;
      }
      const updated = updateExpense(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Expense not found.' });
        return;
      }
      res.json({ expense: updated });
    } catch (err) {
      console.error('PATCH /api/expenses/:id error:', err);
      res.status(500).json({ error: 'Failed to update expense.' });
    }
  });

  app.delete('/api/expenses/:id', (req, res) => {
    try {
      const deleted = deleteExpense(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Expense not found.' });
        return;
      }
      res.json({ deleted: true, id: req.params.id });
    } catch (err) {
      console.error('DELETE /api/expenses/:id error:', err);
      res.status(500).json({ error: 'Failed to delete expense.' });
    }
  });

  app.put('/api/budgets', (req, res) => {
    try {
      const monthKey = typeof req.body?.monthKey === 'string' ? req.body.monthKey : '';
      const category = typeof req.body?.category === 'string' ? req.body.category : '';
      const limitAmount = Number(req.body?.limitAmount);

      if (!/^\d{4}-\d{2}$/.test(monthKey)) {
        res.status(400).json({ error: 'Valid monthKey (YYYY-MM) is required.' });
        return;
      }
      if (!CATEGORY_IDS.includes(category)) {
        res.status(400).json({ error: 'Valid spending category is required.' });
        return;
      }
      const amountErr = validateBudgetAmount(limitAmount);
      if (amountErr) {
        res.status(400).json({ error: amountErr });
        return;
      }

      const budgets = upsertBudgetForMonth(monthKey, category, limitAmount);
      res.json({ budgets });
    } catch (err) {
      console.error('PUT /api/budgets error:', err);
      res.status(500).json({ error: 'Failed to update monthly budget.' });
    }
  });

  app.post('/api/savings', (req, res) => {
    try {
      const validation = validateSavingsInput(req.body ?? {});
      if (!validation.valid) {
        res.status(400).json({ error: 'Invalid savings details.', errors: validation.errors });
        return;
      }
      const created = createSavingsEntry(req.body);
      res.status(201).json({ entry: created });
    } catch (err) {
      console.error('POST /api/savings error:', err);
      res.status(500).json({ error: 'Failed to save savings deposit.' });
    }
  });

  app.delete('/api/savings/:id', (req, res) => {
    try {
      const deleted = deleteSavingsEntry(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Savings entry not found.' });
        return;
      }
      res.json({ deleted: true, id: req.params.id });
    } catch (err) {
      console.error('DELETE /api/savings/:id error:', err);
      res.status(500).json({ error: 'Failed to delete savings entry.' });
    }
  });

  app.put('/api/savings/target', (req, res) => {
    try {
      const monthKey = typeof req.body?.monthKey === 'string' ? req.body.monthKey : '';
      const targetAmount = Number(req.body?.targetAmount);

      if (!/^\d{4}-\d{2}$/.test(monthKey)) {
        res.status(400).json({ error: 'Valid monthKey (YYYY-MM) is required.' });
        return;
      }
      const amountErr = validateSavingsTarget(targetAmount);
      if (amountErr) {
        res.status(400).json({ error: amountErr });
        return;
      }

      const savedTarget = upsertSavingsTargetForMonth(monthKey, targetAmount);
      res.json({ savingsTarget: savedTarget });
    } catch (err) {
      console.error('PUT /api/savings/target error:', err);
      res.status(500).json({ error: 'Failed to update monthly savings target.' });
    }
  });

  app.post('/api/insights', async (req, res) => {
    try {
      const monthParam = typeof req.body?.monthKey === 'string' ? req.body.monthKey : '2026-11';
      const monthKey = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : '2026-11';
      const snapshot = getDashboardSnapshot(monthKey);
      const report = await generateMonthlyAiInsights(
        monthKey,
        snapshot.expenses,
        snapshot.budgets,
        snapshot.previousMonthTotal
      );
      saveCachedAiInsight(monthKey, report);
      res.json({ report });
    } catch (err) {
      console.error('POST /api/insights error:', err);
      res.status(500).json({ error: 'Failed to generate monthly budget insights.' });
    }
  });

  app.post('/api/insights/ask', async (req, res) => {
    try {
      const monthParam = typeof req.body?.monthKey === 'string' ? req.body.monthKey : '2026-11';
      const monthKey = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : '2026-11';
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';

      if (!question) {
        res.status(400).json({ error: 'Please enter a question about your finances.' });
        return;
      }
      if (question.length > 400) {
        res.status(400).json({ error: 'Question must be 400 characters or fewer.' });
        return;
      }

      const snapshot = getDashboardSnapshot(monthKey);
      const result = await askFinancialAdvisor(
        question,
        monthKey,
        snapshot.expenses,
        snapshot.budgets,
        snapshot.previousMonthTotal
      );
      res.json(result);
    } catch (err) {
      console.error('POST /api/insights/ask error:', err);
      res.status(500).json({ error: 'Unable to answer question right now.' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GULLAK server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
