import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  computeCategoryBreakdown,
  computeMonthlySummary,
  formatCurrency,
  formatMonthLabel,
  type AiInsightReport,
  type Expense,
} from '../src/shared/finance.ts';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildAnalyticalFallbackReport(
  monthKey: string,
  expenses: Expense[],
  budgets: Record<string, number>,
  previousMonthTotal: number
): AiInsightReport {
  const summary = computeMonthlySummary(expenses, budgets, monthKey, previousMonthTotal);
  const breakdown = computeCategoryBreakdown(expenses, budgets, monthKey);
  const monthLabel = formatMonthLabel(monthKey);

  if (expenses.length === 0) {
    return {
      monthKey,
      generatedAt: new Date().toISOString(),
      source: 'analytical',
      headline: `No expenses recorded yet for ${monthLabel}`,
      summary: `Your ${monthLabel} ledger is currently empty against a planned budget of ${formatCurrency(summary.totalBudget)}. Log your first daily expenses to unlock pace forecasting and category recommendations.`,
      paceAssessment: `Budget capacity stands at ${formatCurrency(summary.totalBudget)} for the ${summary.daysInMonth}-day month.`,
      topCategoryObservation: 'No category spending has been logged yet.',
      alerts: [
        {
          title: 'Awaiting transaction history',
          detail: 'Add daily purchases or import recurring bills to activate automated anomaly detection.',
          severity: 'info',
        },
      ],
      recommendations: [
        {
          title: 'Log fixed monthly obligations first',
          action: 'Record rent, utilities, and subscriptions at the start of the month so your remaining discretionary balance is accurate.',
          estimatedMonthlySavings: 0,
          category: 'Housing',
        },
      ],
    };
  }

  const topCat = breakdown[0];
  const warningCats = breakdown.filter((c) => c.status === 'warning' || c.status === 'over');
  const discretionaryTop =
    breakdown.find((c) => c.category !== 'Housing' && c.spent > 0) ?? topCat;

  const alerts: AiInsightReport['alerts'] = [];

  for (const cat of warningCats.slice(0, 2)) {
    alerts.push({
      title:
        cat.status === 'over'
          ? `${cat.category} exceeded monthly target`
          : `${cat.category} is at ${cat.utilizationPct}% of budget`,
      detail: `${formatCurrency(cat.spent)} spent out of ${formatCurrency(cat.budget)} allocated (${cat.transactionCount} transactions).`,
      severity: cat.status === 'over' ? 'critical' : 'warning',
    });
  }

  if (summary.projectedMonthEnd > summary.totalBudget) {
    const overage = summary.projectedMonthEnd - summary.totalBudget;
    alerts.push({
      title: 'Projected month-end overrun',
      detail: `At your current pace of ${formatCurrency(summary.dailyAverage)}/day, spending is tracking toward ${formatCurrency(summary.projectedMonthEnd)} (${formatCurrency(overage)} above budget).`,
      severity: 'warning',
    });
  } else {
    alerts.push({
      title: 'Monthly pace within budget',
      detail: `Tracking at ${formatCurrency(summary.dailyAverage)}/day with ${formatCurrency(summary.remainingBudget)} remaining for the rest of ${monthLabel}.`,
      severity: 'info',
    });
  }

  const recommendations: AiInsightReport['recommendations'] = [];
  if (discretionaryTop) {
    const estSavings = Math.round(discretionaryTop.spent * 0.15);
    recommendations.push({
      title: `Trim discretionary spend in ${discretionaryTop.category}`,
      action: `Reducing ${discretionaryTop.category} outflow by 15% over the remaining days preserves roughly ${formatCurrency(estSavings)} this month.`,
      estimatedMonthlySavings: estSavings,
      category: discretionaryTop.category,
    });
  }

  const shopping = breakdown.find((c) => c.category === 'Shopping');
  if (shopping && shopping.spent > 0) {
    const estSavings = Math.round(shopping.spent * 0.2);
    recommendations.push({
      title: 'Apply a 48-hour hold on non-essential Shopping',
      action: `Shopping currently totals ${formatCurrency(shopping.spent)}. Pausing impulse purchases for two days typically trims 20% from monthly retail outflow.`,
      estimatedMonthlySavings: estSavings,
      category: 'Shopping',
    });
  }

  const dining = breakdown.find((c) => c.category === 'Dining & Coffee');
  if (dining && dining.spent > 0) {
    const estSavings = Math.round(dining.spent * 0.18);
    recommendations.push({
      title: 'Cap weekday cafe and takeout frequency',
      action: `Dining & Coffee has ${dining.transactionCount} entries totaling ${formatCurrency(dining.spent)}. Shifting two cafe stops per week to home prep saves ~${formatCurrency(estSavings)}/mo.`,
      estimatedMonthlySavings: estSavings,
      category: 'Dining & Coffee',
    });
  }

  const statusVerb =
    summary.utilizationPct > 100
      ? 'above budget'
      : summary.utilizationPct >= 80
        ? 'approaching the monthly limit'
        : 'tracking on plan';

  return {
    monthKey,
    generatedAt: new Date().toISOString(),
    source: 'analytical',
    headline: `${monthLabel} spending is ${statusVerb} at ${summary.utilizationPct}% utilization`,
    summary: `Across ${summary.transactionCount} transactions in ${monthLabel}, you have spent ${formatCurrency(summary.totalSpent)} of your ${formatCurrency(summary.totalBudget)} budget, leaving ${formatCurrency(summary.remainingBudget)} available.`,
    paceAssessment: `Daily burn averages ${formatCurrency(summary.dailyAverage)}/day across ${summary.daysElapsed} elapsed days, projecting ${formatCurrency(summary.projectedMonthEnd)} by month-end.`,
    topCategoryObservation: topCat
      ? `${topCat.category} leads total outflow at ${formatCurrency(topCat.spent)} (${topCat.utilizationPct}% of its ${formatCurrency(topCat.budget)} target).`
      : 'Spending is evenly distributed across categories.',
    alerts,
    recommendations,
  };
}

export async function generateMonthlyAiInsights(
  monthKey: string,
  expenses: Expense[],
  budgets: Record<string, number>,
  previousMonthTotal: number
): Promise<AiInsightReport> {
  const fallback = buildAnalyticalFallbackReport(monthKey, expenses, budgets, previousMonthTotal);
  if (expenses.length === 0) {
    return fallback;
  }

  const ai = createGeminiClient();
  if (!ai) {
    return fallback;
  }

  const summary = computeMonthlySummary(expenses, budgets, monthKey, previousMonthTotal);
  const breakdown = computeCategoryBreakdown(expenses, budgets, monthKey);
  const monthLabel = formatMonthLabel(monthKey);

  const compactLedger = expenses.slice(0, 60).map((e) => ({
    date: e.date,
    merchant: e.merchant,
    category: e.category,
    amount: e.amount,
    paymentMethod: e.paymentMethod,
  }));

  const prompt = `
Analyze the user's personal finance ledger for ${monthLabel} and provide crisp, practical monthly budget insights.

Monthly Summary:
- Total Spent: ${formatCurrency(summary.totalSpent)}
- Total Monthly Budget: ${formatCurrency(summary.totalBudget)}
- Remaining Budget: ${formatCurrency(summary.remainingBudget)}
- Utilization: ${summary.utilizationPct}%
- Days Elapsed / Total Days: ${summary.daysElapsed} / ${summary.daysInMonth}
- Daily Average Pace: ${formatCurrency(summary.dailyAverage)}
- Projected Month-End Spend: ${formatCurrency(summary.projectedMonthEnd)}
- Previous Month Spend: ${formatCurrency(summary.previousMonthTotal)}
- Top Merchant: ${summary.topMerchant ? `${summary.topMerchant.merchant} (${formatCurrency(summary.topMerchant.total)})` : 'N/A'}

Category Breakdown:
${breakdown
  .map(
    (c) =>
      `- ${c.category}: spent ${formatCurrency(c.spent)} / budget ${formatCurrency(c.budget)} (${c.utilizationPct}%, ${c.transactionCount} txns, status: ${c.status})`
  )
  .join('\n')}

Recent Transactions:
${JSON.stringify(compactLedger)}

Requirements:
- Ground every claim strictly in the numbers above using Indian Rupees (₹).
- Keep headline under 14 words.
- Provide 2 to 3 specific alerts (info, warning, or critical) referencing exact categories or pace figures.
- Provide 2 to 3 actionable savings recommendations with realistic rupee (INR) savings estimates.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a disciplined, calm personal financial analyst. Provide concrete, non-judgmental monthly budget analysis using exact Indian Rupee (₹) amounts from the user ledger.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            paceAssessment: { type: Type.STRING },
            topCategoryObservation: { type: Type.STRING },
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  severity: { type: Type.STRING },
                },
                required: ['title', 'detail', 'severity'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  action: { type: Type.STRING },
                  estimatedMonthlySavings: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                },
                required: ['title', 'action', 'estimatedMonthlySavings', 'category'],
              },
            },
          },
          required: [
            'headline',
            'summary',
            'paceAssessment',
            'topCategoryObservation',
            'alerts',
            'recommendations',
          ],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) return fallback;

    const parsed = JSON.parse(rawText) as Omit<
      AiInsightReport,
      'monthKey' | 'generatedAt' | 'source'
    >;

    const normalizedAlerts: AiInsightReport['alerts'] = (parsed.alerts ?? [])
      .slice(0, 4)
      .map((a) => ({
        title: String(a.title ?? ''),
        detail: String(a.detail ?? ''),
        severity:
          a.severity === 'critical' || a.severity === 'warning' ? a.severity : 'info',
      }));

    const normalizedRecs: AiInsightReport['recommendations'] = (parsed.recommendations ?? [])
      .slice(0, 4)
      .map((r) => ({
        title: String(r.title ?? ''),
        action: String(r.action ?? ''),
        estimatedMonthlySavings: Math.max(0, Math.round(Number(r.estimatedMonthlySavings) || 0)),
        category: String(r.category ?? 'General'),
      }));

    return {
      monthKey,
      generatedAt: new Date().toISOString(),
      source: 'gemini',
      headline: String(parsed.headline || fallback.headline),
      summary: String(parsed.summary || fallback.summary),
      paceAssessment: String(parsed.paceAssessment || fallback.paceAssessment),
      topCategoryObservation: String(
        parsed.topCategoryObservation || fallback.topCategoryObservation
      ),
      alerts: normalizedAlerts.length > 0 ? normalizedAlerts : fallback.alerts,
      recommendations:
        normalizedRecs.length > 0 ? normalizedRecs : fallback.recommendations,
    };
  } catch (err) {
    console.error('Gemini insights generation fallback:', err);
    return fallback;
  }
}

export async function askFinancialAdvisor(
  question: string,
  monthKey: string,
  expenses: Expense[],
  budgets: Record<string, number>,
  previousMonthTotal: number
): Promise<{ answer: string; source: 'gemini' | 'analytical' }> {
  const summary = computeMonthlySummary(expenses, budgets, monthKey, previousMonthTotal);
  const breakdown = computeCategoryBreakdown(expenses, budgets, monthKey);
  const monthLabel = formatMonthLabel(monthKey);

  const ai = createGeminiClient();
  if (!ai) {
    const top = breakdown[0];
    return {
      source: 'analytical',
      answer: `For ${monthLabel}, you have spent ${formatCurrency(summary.totalSpent)} of your ${formatCurrency(summary.totalBudget)} budget (${summary.utilizationPct}% utilized, ${formatCurrency(summary.remainingBudget)} remaining). Your largest category is ${top?.category ?? 'N/A'} at ${formatCurrency(top?.spent ?? 0)}, and your daily average pace is ${formatCurrency(summary.dailyAverage)}/day.`,
    };
  }

  const prompt = `
User question about their ${monthLabel} personal finances:
"${question}"

Financial Context (${monthLabel}):
- Total Spent: ${formatCurrency(summary.totalSpent)}
- Monthly Budget: ${formatCurrency(summary.totalBudget)}
- Remaining Balance: ${formatCurrency(summary.remainingBudget)}
- Daily Pace: ${formatCurrency(summary.dailyAverage)}/day (projected month-end: ${formatCurrency(summary.projectedMonthEnd)})
- Previous Month Total: ${formatCurrency(summary.previousMonthTotal)}
- Category Breakdown: ${JSON.stringify(breakdown)}
- Transactions: ${JSON.stringify(expenses.slice(0, 60))}

Provide a concise, direct answer (2 to 4 sentences) citing exact figures from the data. Do not invent transactions.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are GULLAK Financial Advisor. Answer personal finance questions concisely in plain text using only the provided transaction and budget data.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty Gemini response');
    }
    return { answer: text, source: 'gemini' };
  } catch (err) {
    console.error('Gemini advisor Q&A error:', err);
    const top = breakdown[0];
    return {
      source: 'analytical',
      answer: `Based on your ${monthLabel} ledger, total spending is ${formatCurrency(summary.totalSpent)} against a ${formatCurrency(summary.totalBudget)} budget (${formatCurrency(summary.remainingBudget)} left). ${top ? `${top.category} is your largest category at ${formatCurrency(top.spent)}.` : ''}`,
    };
  }
}
