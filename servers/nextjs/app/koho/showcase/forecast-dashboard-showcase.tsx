'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LineChart,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@kit/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import {
  budgetVariance,
  forecastData,
  forecastLocationBreakdown,
  forecastSummaries,
} from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting', active: true },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk' },
  { icon: Settings, label: 'Settings' },
];

const scenarios = ['base', 'optimistic', 'conservative'] as const;
type Scenario = (typeof scenarios)[number];

const scenarioLabels: Record<Scenario, string> = {
  base: 'Base Case',
  optimistic: 'Optimistic',
  conservative: 'Conservative',
};

const scenarioColors: Record<Scenario, string> = {
  base: 'bg-primary/10 text-primary',
  optimistic: 'bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))]',
  conservative: 'bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]',
};

const chartConfig = {
  actual: { label: 'Actual', color: 'hsl(var(--chart-1))' },
  forecast: { label: 'Forecast', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

function formatAxis(v: number) {
  return `£${Math.round(v / 1000)}k`;
}

export function ForecastDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const [activeScenario, setActiveScenario] = useState<Scenario>('base');

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const interval = setInterval(() => {
      setActiveScenario((prev) => {
        const idx = scenarios.indexOf(prev);
        return scenarios[(idx + 1) % scenarios.length]!;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [inView, reduceMotion]);

  const data = forecastData[activeScenario];
  const summary = forecastSummaries[activeScenario]!;

  return (
    <div ref={ref} className="flex overflow-hidden rounded-md bg-background text-foreground">
      {/* Sidebar */}
      <motion.div
        className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border/40 bg-muted/30 py-3 sm:flex"
        initial={animate ? { x: -48, opacity: 0 } : false}
        animate={animate ? { x: 0, opacity: 1 } : undefined}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-[10px] font-bold text-primary-foreground">K</span>
        </div>
        {navItems.map((item, i) => (
          <motion.div
            key={item.label}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              item.active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            initial={animate ? { opacity: 0, x: -12 } : false}
            animate={animate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
          >
            <item.icon className="h-3.5 w-3.5" />
          </motion.div>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header bar */}
        <motion.div
          className="flex items-center justify-between border-b border-border/40 px-3 py-2 sm:px-4"
          initial={animate ? { opacity: 0, y: -8 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <LineChart className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Forecasting</span>
            <span className="text-[10px] text-muted-foreground">/ Revenue Scenarios</span>
          </div>
          <div className="flex items-center gap-1.5">
            {scenarios.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveScenario(s)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[9px] font-medium transition-colors',
                  activeScenario === s
                    ? scenarioColors[s]
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {scenarioLabels[s]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Dashboard body */}
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {/* KPI row */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`kpis-${activeScenario}`}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                <p className="text-[9px] text-muted-foreground">Projected MRR</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-sm font-semibold tabular-nums sm:text-base">{summary.projected}</p>
                  <Badge variant="outline" className={cn('text-[8px]', scenarioColors[activeScenario])}>
                    {scenarioLabels[activeScenario]}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                <p className="text-[9px] text-muted-foreground">Growth (6m)</p>
                <p className="text-sm font-semibold tabular-nums text-[hsl(var(--status-healthy))] sm:text-base">
                  {summary.growth}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                <p className="text-[9px] text-muted-foreground">Target Occupancy</p>
                <p className="text-sm font-semibold tabular-nums sm:text-base">{summary.occupancy}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                <p className="text-[9px] text-muted-foreground">Budget Variance</p>
                <p className="text-sm font-semibold tabular-nums text-[hsl(var(--status-healthy))] sm:text-base">
                  +£8.4k
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Chart + Budget variance row */}
          <div className="grid h-[280px] grid-cols-1 gap-3 sm:h-[360px] sm:grid-cols-5">
            {/* Revenue forecast chart */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-3"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">Revenue Forecast</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Actual vs Projected</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeScenario}
                    className="h-full w-full"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                        <defs>
                          <linearGradient id="dashForecastFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={formatAxis}
                          width={36}
                          domain={['dataMin - 5000', 'dataMax + 5000']}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ReferenceLine
                          x="Mar"
                          stroke="hsl(var(--border))"
                          strokeDasharray="3 3"
                          label={{ value: 'Today', position: 'top', className: 'text-[8px] fill-muted-foreground' }}
                        />
                        <Line
                          dataKey="actual"
                          type="monotone"
                          stroke="var(--color-actual)"
                          strokeWidth={2}
                          dot={{ r: 2.5, fill: 'var(--color-actual)' }}
                          connectNulls={false}
                        />
                        <Area
                          dataKey="forecast"
                          type="monotone"
                          stroke="var(--color-forecast)"
                          strokeWidth={2}
                          strokeDasharray="6 3"
                          fill="url(#dashForecastFill)"
                          dot={false}
                          connectNulls
                        />
                      </AreaChart>
                    </ChartContainer>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Budget variance */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <Target className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Budget vs Actual</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden px-3 py-2">
                {budgetVariance.map((item, i) => (
                  <motion.div
                    key={item.category}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.65 + i * 0.06, duration: 0.25 }}
                  >
                    <span className="w-16 shrink-0 truncate text-[9px] text-muted-foreground">
                      {item.category}
                    </span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full',
                          item.variance >= 0 ? 'bg-[hsl(var(--status-healthy)/0.5)]' : 'bg-primary/50',
                        )}
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${Math.min(Math.abs(item.actual / item.budget) * 100, 100)}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span
                      className={cn(
                        'w-10 shrink-0 text-right text-[9px] tabular-nums font-medium',
                        item.variance >= 0
                          ? 'text-[hsl(var(--status-healthy))]'
                          : 'text-foreground',
                      )}
                    >
                      {item.variance >= 0 ? '+' : ''}{item.variance}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Location forecast table */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.7, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Location Forecast</span>
              </div>
              <span className="text-[9px] text-muted-foreground">
                6-month outlook
              </span>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="px-3 py-1.5 text-left font-medium">Location</th>
                    <th className="px-3 py-1.5 text-right font-medium">Current MRR</th>
                    <th className="px-3 py-1.5 text-right font-medium">Forecast</th>
                    <th className="hidden px-3 py-1.5 text-right font-medium sm:table-cell">Occ. Now</th>
                    <th className="hidden px-3 py-1.5 text-right font-medium sm:table-cell">Occ. Target</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastLocationBreakdown.map((row, i) => (
                    <motion.tr
                      key={row.location}
                      className="border-b border-border/10 last:border-b-0"
                      initial={animate ? { opacity: 0 } : false}
                      animate={animate ? { opacity: 1 } : undefined}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}
                    >
                      <td className="px-3 py-1.5 font-medium">{row.location}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        £{(row.currentMRR / 1000).toFixed(0)}k
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[hsl(var(--status-healthy))]">
                        £{(row.forecastMRR / 1000).toFixed(0)}k
                      </td>
                      <td className="hidden px-3 py-1.5 text-right tabular-nums sm:table-cell">
                        {row.occupancy}%
                      </td>
                      <td className="hidden px-3 py-1.5 text-right tabular-nums sm:table-cell">
                        {row.forecastOcc}%
                      </td>
                      <td className="hidden px-3 py-1.5 sm:table-cell">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium',
                            row.status === 'On Track'
                              ? 'bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))]'
                              : 'bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]',
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
