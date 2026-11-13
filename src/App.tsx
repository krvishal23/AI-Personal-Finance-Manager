import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeCategoryBreakdown,
  computeDailySeries,
  computeMonthlySummary,
  computeSavingsSummary,
  DEFAULT_MONTHLY_SAVINGS_TARGET,
  getMonthKey,
  type AiInsightReport,
  type Expense,
  type ExpenseInput,
  type SavingsEntry,
  type SavingsEntryInput,
} from './shared/finance';
import { AiInsightsView } from './components/AiInsightsView';
import { BudgetsView } from './components/BudgetsView';
import { ExpenseModal } from './components/ExpenseModal';
import { ExpensesLedgerView } from './components/ExpensesLedgerView';
import { OverviewView } from './components/OverviewView';
import { SavingsView } from './components/SavingsView';
import { Sidebar, type NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';

interface DashboardApiPayload {
  monthKey: string;
  expenses: Expense[];
  budgets: Record<string, number>;
  previousMonthTotal: number;
  cachedInsight: AiInsightReport | null;
  availableMonths: string[];
  allSavings?: SavingsEntry[];
  savingsTarget?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [availableMonths, setAvailableMonths] = useState<string[]>(['2026-11', '2026-10']);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);
  const [aiReport, setAiReport] = useState<AiInsightReport | null>(null);
  const [allSavings, setAllSavings] = useState<SavingsEntry[]>([]);
  const [savingsTarget, setSavingsTarget] = useState(DEFAULT_MONTHLY_SAVINGS_TARGET);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const loadDashboard = useCallback(async (monthKey: string) => {
    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const res = await fetch(`/api/dashboard?month=${encodeURIComponent(monthKey)}`);
      if (!res.ok) {
        throw new Error('Failed to load financial data from server.');
      }
      const data = (await res.json()) as DashboardApiPayload;
      setExpenses(data.expenses);
      setBudgets(data.budgets);
      setPreviousMonthTotal(data.previousMonthTotal);
      setAiReport(data.cachedInsight);
      setAllSavings(data.allSavings ?? []);
      setSavingsTarget(data.savingsTarget ?? DEFAULT_MONTHLY_SAVINGS_TARGET);
      if (data.availableMonths?.length) {
        setAvailableMonths(data.availableMonths);
      }
    } catch (err) {
      setDashboardError(
        err instanceof Error ? err.message : 'Unable to connect to GULLAK backend.'
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(selectedMonth);
  }, [selectedMonth, loadDashboard]);

  const summary = useMemo(
    () => computeMonthlySummary(expenses, budgets, selectedMonth, previousMonthTotal),
    [expenses, budgets, selectedMonth, previousMonthTotal]
  );

  const dailySeries = useMemo(
    () => computeDailySeries(expenses, selectedMonth),
    [expenses, selectedMonth]
  );

  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(expenses, budgets, selectedMonth),
    [expenses, budgets, selectedMonth]
  );

  const savingsSummary = useMemo(
    () => computeSavingsSummary(allSavings, selectedMonth, savingsTarget),
    [allSavings, selectedMonth, savingsTarget]
  );

  const latestSaving = allSavings[0] ?? null;

  const handleSaveExpense = async (input: ExpenseInput, editingId?: string) => {
    const endpoint = editingId ? `/api/expenses/${editingId}` : '/api/expenses';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Could not save expense.');
    }

    const expenseMonth = getMonthKey(input.date);
    if (expenseMonth !== selectedMonth) {
      setSelectedMonth(expenseMonth);
    } else {
      await loadDashboard(selectedMonth);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to delete expense.');
    }
    await loadDashboard(selectedMonth);
  };

  const handleSaveBudget = async (category: string, limitAmount: number) => {
    const res = await fetch('/api/budgets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthKey: selectedMonth,
        category,
        limitAmount,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to update budget.');
    }
    setBudgets(body.budgets);
    setAiReport(null);
  };

  const handleAddSavings = async (input: SavingsEntryInput) => {
    const res = await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Could not save savings deposit.');
    }
    const entryMonth = getMonthKey(input.date);
    if (entryMonth !== selectedMonth) {
      setSelectedMonth(entryMonth);
    } else {
      await loadDashboard(selectedMonth);
    }
  };

  const handleDeleteSavings = async (entry: SavingsEntry) => {
    const res = await fetch(`/api/savings/${entry.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to delete savings deposit.');
    }
    await loadDashboard(selectedMonth);
  };

  const handleSaveSavingsTarget = async (targetAmount: number) => {
    const res = await fetch('/api/savings/target', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthKey: selectedMonth,
        targetAmount,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to update savings target.');
    }
    setSavingsTarget(body.savingsTarget);
  };

  const handleGenerateInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthKey: selectedMonth }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Unable to generate insights.');
      }
      setAiReport(body.report);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unable to generate monthly insights.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleAskAdvisor = async (question: string) => {
    const res = await fetch('/api/insights/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthKey: selectedMonth, question }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Unable to answer question.');
    }
    return body as { answer: string; source: string };
  };

  const defaultExpenseDate =
    selectedMonth === '2026-11' ? '2026-11-13' : `${selectedMonth}-15`;

  return (
    <div className="relative min-h-screen flex bg-slate-950 text-slate-100">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src="/assets/aistudio/1_lJoevcmt5HHTWbaz0u-s6w_441ee4e4.jpg"
          alt=""
          className="h-full w-full object-cover object-center scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/72 to-slate-950/85 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-1 min-w-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            activeTab={activeTab}
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onChangeMonth={setSelectedMonth}
            onOpenNewExpense={() => {
              setEditingExpense(null);
              setModalOpen(true);
            }}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8 max-w-[1360px] w-full mx-auto">
            {dashboardError && (
              <div
                role="alert"
                className="mb-6 border-b border-red-400/40 pb-3 text-sm text-red-300 flex items-center justify-between gap-4"
              >
                <span>{dashboardError}</span>
                <button
                  type="button"
                  onClick={() => loadDashboard(selectedMonth)}
                  className="text-xs font-semibold underline shrink-0 text-red-200 hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

          {activeTab === 'overview' && (
            <OverviewView
              monthKey={selectedMonth}
              summary={summary}
              savingsSummary={savingsSummary}
              latestSaving={latestSaving}
              dailySeries={dailySeries}
              categoryBreakdown={categoryBreakdown}
              recentExpenses={expenses}
              aiReport={aiReport}
              aiLoading={aiLoading}
              loading={loadingDashboard}
              onGenerateInsights={handleGenerateInsights}
              onViewAllExpenses={() => setActiveTab('expenses')}
              onManageBudgets={() => setActiveTab('budgets')}
              onOpenSavings={() => setActiveTab('savings')}
              onOpenAiWorkspace={() => setActiveTab('insights')}
              onLogFirstExpense={() => {
                setEditingExpense(null);
                setModalOpen(true);
              }}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesLedgerView
              monthKey={selectedMonth}
              expenses={expenses}
              loading={loadingDashboard}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onLogNewExpense={() => {
                setEditingExpense(null);
                setModalOpen(true);
              }}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              monthKey={selectedMonth}
              summary={summary}
              breakdown={categoryBreakdown}
              onSaveBudget={handleSaveBudget}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsView
              monthKey={selectedMonth}
              defaultDate={defaultExpenseDate}
              entries={allSavings}
              summary={savingsSummary}
              loading={loadingDashboard}
              onAddSavings={handleAddSavings}
              onDeleteSavings={handleDeleteSavings}
              onSaveTarget={handleSaveSavingsTarget}
            />
          )}

            {activeTab === 'insights' && (
              <AiInsightsView
                monthKey={selectedMonth}
                summary={summary}
                report={aiReport}
                loading={aiLoading}
                error={aiError}
                onGenerate={handleGenerateInsights}
                onAskQuestion={handleAskAdvisor}
              />
            )}
          </main>
        </div>
      </div>

      <ExpenseModal
        open={modalOpen}
        defaultDate={defaultExpenseDate}
        editingExpense={editingExpense}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
      />
    </div>
  );
}
