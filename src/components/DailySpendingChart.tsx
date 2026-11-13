import { useMemo, useState } from 'react';
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLabel,
  type DailyPoint,
} from '../shared/finance';

interface DailySpendingChartProps {
  points: DailyPoint[];
  monthKey: string;
  totalBudget: number;
  dailyAverage: number;
  peakDay: { date: string; total: number } | null;
  topMerchant: { merchant: string; total: number } | null;
}

export function DailySpendingChart({
  points,
  monthKey,
  totalBudget,
  dailyAverage,
  peakDay,
  topMerchant,
}: DailySpendingChartProps) {
  const [mode, setMode] = useState<'daily' | 'cumulative'>('daily');
  const [hoveredDay, setHoveredDay] = useState<DailyPoint | null>(null);

  const nonZeroPoints = useMemo(() => points.filter((p) => p.total > 0), [points]);

  const maxVal = useMemo(() => {
    if (mode === 'cumulative') {
      const lastCum = points[points.length - 1]?.cumulative ?? 0;
      return Math.max(lastCum, totalBudget, 100);
    }
    const peak = points.reduce((m, p) => (p.total > m ? p.total : m), 0);
    return Math.max(peak, 100);
  }, [mode, points, totalBudget]);

  const svgWidth = 720;
  const svgHeight = 250;
  const padLeft = 62;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 30;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const barSlot = chartW / Math.max(1, points.length);
  const barWidth = Math.max(6, Math.min(16, barSlot * 0.66));

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const cumulativePath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((pt, idx) => {
        const x = padLeft + idx * barSlot + barSlot / 2;
        const y = padTop + chartH - (pt.cumulative / maxVal) * chartH;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, barSlot, chartH, maxVal]);

  const cumulativeAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = padLeft + barSlot / 2;
    const lastX = padLeft + (points.length - 1) * barSlot + barSlot / 2;
    const baseY = padTop + chartH;
    return `${cumulativePath} L${lastX.toFixed(1)},${baseY.toFixed(1)} L${firstX.toFixed(1)},${baseY.toFixed(1)} Z`;
  }, [cumulativePath, points.length, barSlot, chartH]);

  const avgY =
    mode === 'daily'
      ? padTop + chartH - Math.min(1, dailyAverage / maxVal) * chartH
      : padTop + chartH - Math.min(1, totalBudget / maxVal) * chartH;

  const activePoint =
    hoveredDay ?? nonZeroPoints[nonZeroPoints.length - 1] ?? points[0] ?? null;

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/12">
        <div>
          <h2 className="text-base font-semibold text-white">
            Daily Spending Trajectory
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {formatMonthLabel(monthKey)} ·{' '}
            {activePoint ? (
              <span className="text-white font-medium tabular-nums">
                {activePoint.date}:{' '}
                {mode === 'daily'
                  ? `${formatCurrency(activePoint.total)} (${activePoint.count} ${
                      activePoint.count === 1 ? 'expense' : 'expenses'
                    })`
                  : `${formatCurrency(activePoint.cumulative)} cumulative`}
              </span>
            ) : (
              'No daily records'
            )}
          </p>
        </div>

        <div
          role="group"
          aria-label="Chart display mode"
          className="flex items-center gap-1 p-1 bg-white/8 border border-white/12 rounded-lg shrink-0"
        >
          <button
            type="button"
            onClick={() => setMode('daily')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'daily'
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Daily Bars
          </button>
          <button
            type="button"
            onClick={() => setMode('cumulative')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'cumulative'
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Cumulative Pace
          </button>
        </div>
      </div>

      <div className="mt-4 w-full overflow-hidden" data-testid="daily-spending-chart">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`Spending chart for ${formatMonthLabel(monthKey)}`}
          onMouseLeave={() => setHoveredDay(null)}
        >
          {yTicks.map((ratio) => {
            const val = maxVal * ratio;
            const y = padTop + chartH - ratio * chartH;
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-300 text-[11px] font-mono"
                >
                  {formatCompactCurrency(val)}
                </text>
              </g>
            );
          })}

          {(mode === 'daily' ? dailyAverage > 0 : totalBudget > 0) && (
            <g>
              <line
                x1={padLeft}
                y1={avgY}
                x2={svgWidth - padRight}
                y2={avgY}
                stroke={mode === 'daily' ? '#34d399' : '#fbbf24'}
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
              <text
                x={svgWidth - padRight}
                y={Math.max(padTop + 10, avgY - 5)}
                textAnchor="end"
                className={`text-[10px] font-medium ${
                  mode === 'daily' ? 'fill-emerald-300' : 'fill-amber-300'
                }`}
              >
                {mode === 'daily'
                  ? `Avg ${formatCurrency(dailyAverage)}/day`
                  : `Budget Cap ${formatCompactCurrency(totalBudget)}`}
              </text>
            </g>
          )}

          {mode === 'cumulative' && (
            <g>
              <path d={cumulativeAreaPath} fill="#10b981" fillOpacity="0.22" />
              <path
                d={cumulativePath}
                fill="none"
                stroke="#34d399"
                strokeWidth="2.25"
                strokeLinejoin="round"
              />
            </g>
          )}

          {points.map((pt, idx) => {
            const centerX = padLeft + idx * barSlot + barSlot / 2;
            const barH = Math.max(pt.total > 0 ? 4 : 0, (pt.total / maxVal) * chartH);
            const barY = padTop + chartH - barH;
            const isHovered = hoveredDay?.day === pt.day;
            const showLabel = pt.day === 1 || pt.day % 5 === 0 || pt.day === points.length;

            return (
              <g
                key={pt.day}
                onMouseEnter={() => setHoveredDay(pt)}
                className="cursor-pointer"
              >
                <rect
                  x={padLeft + idx * barSlot}
                  y={padTop}
                  width={barSlot}
                  height={chartH}
                  fill="transparent"
                />

                {mode === 'daily' ? (
                  <rect
                    x={centerX - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={barH}
                    rx="3"
                    fill={
                      isHovered
                        ? '#6ee7b7'
                        : pt.total > dailyAverage * 1.8 && pt.total > 0
                          ? '#f8fafc'
                          : '#10b981'
                    }
                    fillOpacity={pt.total > 0 ? 1 : 0}
                  />
                ) : (
                  <circle
                    cx={centerX}
                    cy={padTop + chartH - (pt.cumulative / maxVal) * chartH}
                    r={isHovered ? 4.5 : pt.total > 0 ? 2.5 : 0}
                    fill="#34d399"
                  />
                )}

                {showLabel && (
                  <text
                    x={centerX}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className="fill-slate-300 text-[11px] font-mono"
                  >
                    {pt.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 pt-4 border-t border-white/12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-300">Peak Spend Day</p>
          <p className="mt-1 text-sm font-medium text-white font-mono tabular-nums">
            {peakDay ? `${peakDay.date} · ${formatCurrency(peakDay.total)}` : 'No data'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-300">Top Merchant</p>
          <p className="mt-1 text-sm font-medium text-white truncate">
            {topMerchant
              ? `${topMerchant.merchant} · ${formatCurrency(topMerchant.total)}`
              : 'No data'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-300">Active Spend Days</p>
          <p className="mt-1 text-sm font-medium text-white font-mono tabular-nums">
            {nonZeroPoints.length} of {points.length} days
          </p>
        </div>
      </div>
    </div>
  );
}
