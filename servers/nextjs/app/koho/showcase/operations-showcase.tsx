'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Area, CartesianGrid, ComposedChart, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';
import { operationsKPIs, occupancyVsUtilisation } from './showcase-data';

const chartConfig = {
  utilisation: { label: 'Utilisation', color: 'hsl(var(--chart-2))' },
  spread: { label: 'Occupancy headroom', color: 'hsl(var(--chart-6))' },
} satisfies ChartConfig;

export function OperationsShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: '-24px' });
  const reduce = useReducedMotion();
  const animate = inView && !reduce;

  const chartData = useMemo(
    () =>
      occupancyVsUtilisation.map((d) => ({
        month: d.month,
        utilisation: d.utilisation,
        spread: Number((d.occupancy - d.utilisation).toFixed(2)),
      })),
    [],
  );

  return (
    <Card ref={rootRef} className="w-full max-w-3xl border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {operationsKPIs.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animate ? i * 0.07 : 0, duration: 0.35 }}
            >
              <Card
                className={cn(
                  'border-border/50 shadow-none',
                  kpi.variant === 'success' && 'border-[hsl(var(--status-healthy)/0.25)]',
                  kpi.variant === 'warning' && 'border-[hsl(var(--status-warning)/0.25)]',
                )}
              >
                <CardContent className="space-y-1 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {kpi.label}
                  </span>
                  <p className="text-lg font-semibold tabular-nums">{kpi.value}</p>
                  <p
                    className={cn(
                      'text-[11px] font-medium',
                      kpi.trend.sentiment === 'positive' && 'text-[hsl(var(--delta-positive))]',
                      kpi.trend.sentiment !== 'positive' && 'text-[hsl(var(--delta-negative))]',
                    )}
                  >
                    {kpi.trend.direction === 'up' ? '+' : ''}
                    {kpi.trend.delta}
                    {kpi.trend.isPercentage ? '%' : ''} {kpi.trend.comparisonPeriod}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: animate ? 0.25 : 0, duration: 0.5 }}
        >
          <ChartContainer config={chartConfig} className="aspect-[16/9] h-[220px] w-full max-h-[260px]">
            <ComposedChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                domain={[55, 95]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={36}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="utilisation"
                stackId="stack"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="hsl(var(--chart-3) / 0.14)"
                isAnimationActive={animate}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="spread"
                stackId="stack"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="hsl(var(--chart-6) / 0.22)"
                isAnimationActive={animate}
                animationDuration={1000}
              />
            </ComposedChart>
          </ChartContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}
