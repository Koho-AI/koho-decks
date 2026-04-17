'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

import { ChartConfig, ChartContainer } from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import { waterfallData } from './showcase-data';

function buildWaterfallRows() {
  let cumulative = 0;
  const rows: { name: string; base: number; segment: number; fill: string }[] = [];

  for (const item of waterfallData) {
    if (item.name === 'Opening') {
      rows.push({
        name: item.name,
        base: 0,
        segment: item.value,
        fill: item.fill,
      });
      cumulative = item.value;
      continue;
    }

    if (item.name === 'Closing') {
      rows.push({
        name: item.name,
        base: 0,
        segment: item.value,
        fill: item.fill,
      });
      continue;
    }

    if (item.value >= 0) {
      rows.push({
        name: item.name,
        base: cumulative,
        segment: item.value,
        fill: item.fill,
      });
      cumulative += item.value;
    } else {
      const next = cumulative + item.value;
      rows.push({
        name: item.name,
        base: next,
        segment: Math.abs(item.value),
        fill: item.fill,
      });
      cumulative = next;
    }
  }

  return rows;
}

const chartConfig = {
  base: { label: 'Base', color: 'transparent' },
  segment: { label: 'MRR', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

function formatAxis(v: number) {
  if (Math.abs(v) >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}m`;
  if (Math.abs(v) >= 1000) return `£${Math.round(v / 1000)}k`;
  return `£${v}`;
}

export function RevenueWaterfallShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const rows = useMemo(() => buildWaterfallRows(), []);

  return (
    <motion.div
      ref={ref}
      className="flex flex-col gap-2"
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: reduceMotion ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Revenue Movement</h3>
        <p className="text-sm font-semibold tabular-nums text-[hsl(var(--chart-1))]">
          £287,450
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className={cn('aspect-auto h-[180px] w-full')}
      >
        <BarChart
          accessibilityLayer
          data={rows}
          margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
        >
          <CartesianGrid vertical={false} className="stroke-border/40" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={40}
            className="text-[8px] md:text-[9px]"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={formatAxis}
            className="text-[10px]"
          />
          <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="segment" stackId="wf" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((row, i) => (
              <Cell key={`seg-${i}`} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </motion.div>
  );
}
