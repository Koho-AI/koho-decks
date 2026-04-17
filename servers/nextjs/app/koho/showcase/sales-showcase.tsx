'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';
import { leadSourceData, salesCycleData, salesKPIs } from './showcase-data';
import { useCountUp } from './use-count-up';

const cycleConfig = {
  avgDays: { label: 'Avg. days', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const leadConfig = {
  won: { label: 'Won', color: 'hsl(var(--chart-5))' },
  active: { label: 'Active', color: 'hsl(var(--chart-3))' },
  lost: { label: 'Lost', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

function SalesKpiMini({
  label,
  end,
  prefix,
  suffix,
  delta,
  sentiment,
}: {
  label: string;
  end: number;
  prefix?: string;
  suffix?: string;
  delta: number;
  sentiment: 'positive' | 'negative';
}) {
  const { ref, display } = useCountUp({
    end,
    duration: 1,
    prefix: prefix ?? '',
    suffix: suffix ?? '',
    decimals: suffix === '%' ? 0 : 0,
  });
  const deltaPositive = sentiment === 'positive';
  return (
    <Card className="border-border/50 shadow-none">
      <CardContent className="space-y-1 p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <p ref={ref} className="text-lg font-semibold tabular-nums">
          {display}
        </p>
        <p
          className={cn(
            'text-[11px] font-medium',
            deltaPositive
              ? 'text-[hsl(var(--delta-positive))]'
              : 'text-[hsl(var(--delta-negative))]',
          )}
        >
          {delta > 0 ? '+' : ''}
          {delta}
          {suffix === '%' ? '%' : ''} vs prior
        </p>
      </CardContent>
    </Card>
  );
}

export function SalesShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: '-24px' });
  const reduce = useReducedMotion();
  const animate = inView && !reduce;

  const kpi0 = salesKPIs[0]!;
  const kpi1 = salesKPIs[1]!;

  return (
    <Card ref={rootRef} className="w-full max-w-3xl border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(0,200px)]">
          <motion.div
            initial={animate ? { opacity: 0, x: -12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-[200px]"
          >
            <ChartContainer config={cycleConfig} className="h-[220px] w-full">
              <BarChart
                accessibilityLayer
                layout="vertical"
                data={salesCycleData}
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="unitType"
                  width={88}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="avgDays"
                  fill="var(--color-avgDays)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                  isAnimationActive={animate}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ChartContainer>
          </motion.div>

          <motion.div
            className="grid gap-3"
            initial={animate ? { opacity: 0, x: 12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SalesKpiMini
              label={kpi0.label}
              end={kpi0.numericValue}
              delta={kpi0.delta}
              sentiment={kpi0.sentiment}
            />
            <SalesKpiMini
              label={kpi1.label}
              end={kpi1.numericValue}
              suffix="%"
              delta={kpi1.delta}
              sentiment={kpi1.sentiment}
            />
          </motion.div>
        </div>

        <motion.div
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animate ? 0.2 : 0, duration: 0.45 }}
        >
          <ChartContainer config={leadConfig} className="h-[200px] w-full">
            <BarChart
              accessibilityLayer
              data={leadSourceData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="source" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={28} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Legend
                wrapperStyle={{ paddingTop: 4 }}
                formatter={(v) => <span className="text-muted-foreground text-xs">{v}</span>}
              />
              <Bar
                dataKey="won"
                stackId="a"
                fill="var(--color-won)"
                radius={[0, 0, 0, 0]}
                isAnimationActive={animate}
                animationDuration={800}
              />
              <Bar
                dataKey="active"
                stackId="a"
                fill="var(--color-active)"
                radius={[0, 0, 0, 0]}
                isAnimationActive={animate}
                animationDuration={800}
              />
              <Bar
                dataKey="lost"
                stackId="a"
                fill="var(--color-lost)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={animate}
                animationDuration={800}
              />
            </BarChart>
          </ChartContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}
