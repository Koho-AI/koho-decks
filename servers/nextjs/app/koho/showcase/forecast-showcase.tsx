'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import { forecastData, forecastSummaries } from './showcase-data';

const scenarios = ['base', 'optimistic', 'conservative'] as const;
type Scenario = (typeof scenarios)[number];

const scenarioLabels: Record<Scenario, string> = {
  base: 'Base Case',
  optimistic: 'Optimistic',
  conservative: 'Conservative',
};

const chartConfig = {
  actual: { label: 'Actual', color: 'hsl(var(--chart-1))' },
  forecast: { label: 'Forecast', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

function formatAxis(v: number) {
  return `£${Math.round(v / 1000)}k`;
}

export function ForecastShowcase() {
  const [activeScenario, setActiveScenario] = useState<Scenario>('base');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActiveScenario((prev) => {
        const idx = scenarios.indexOf(prev);
        return scenarios[(idx + 1) % scenarios.length]!;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const data = forecastData[activeScenario];
  const summary = forecastSummaries[activeScenario];
  const lastActualMonth = 'Mar';

  return (
    <div className="flex flex-col gap-3">
      {/* Scenario tabs */}
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
        role="tablist"
      >
        {scenarios.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={activeScenario === s}
            onClick={() => setActiveScenario(s)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              activeScenario === s
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {scenarioLabels[s]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScenario}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <ChartContainer config={chartConfig} className="aspect-[16/9] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} className="stroke-border/40" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[10px]"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxis}
                width={44}
                className="text-[10px]"
                domain={['dataMin - 5000', 'dataMax + 5000']}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(raw, name) => (
                      <span className="font-mono text-xs tabular-nums">
                        {name === 'actual' ? 'Actual' : 'Forecast'}: £{(Number(raw) / 1000).toFixed(0)}k
                      </span>
                    )}
                  />
                }
              />
              <ReferenceLine
                x={lastActualMonth}
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
                label={{ value: 'Today', position: 'top', className: 'text-[9px] fill-muted-foreground' }}
              />
              <Line
                name="Actual"
                dataKey="actual"
                type="monotone"
                stroke="var(--color-actual)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--color-actual)' }}
                connectNulls={false}
              />
              <Area
                name="Forecast"
                dataKey="forecast"
                type="monotone"
                stroke="var(--color-forecast)"
                strokeWidth={2}
                strokeDasharray="6 3"
                fill="url(#forecastFill)"
                dot={false}
                connectNulls
              />
            </AreaChart>
          </ChartContainer>
        </motion.div>
      </AnimatePresence>

      {/* Summary KPIs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`summary-${activeScenario}`}
          className="grid grid-cols-3 gap-2"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {summary && (
            <>
              <Card className="border-border/60 px-3 py-2 shadow-none text-center">
                <p className="text-[10px] text-muted-foreground">Projected MRR</p>
                <p className="text-sm font-semibold tabular-nums">{summary.projected}</p>
              </Card>
              <Card className="border-border/60 px-3 py-2 shadow-none text-center">
                <p className="text-[10px] text-muted-foreground">Growth</p>
                <p className="text-sm font-semibold tabular-nums text-[hsl(var(--delta-positive))]">
                  {summary.growth}
                </p>
              </Card>
              <Card className="border-border/60 px-3 py-2 shadow-none text-center">
                <p className="text-[10px] text-muted-foreground">Target Occupancy</p>
                <p className="text-sm font-semibold tabular-nums">{summary.occupancy}</p>
              </Card>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
