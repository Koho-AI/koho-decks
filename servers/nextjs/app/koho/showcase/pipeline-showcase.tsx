'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import { pipelineDetailed } from './showcase-data';

const chartConfig = {
  available: {
    label: 'Available',
    color: 'hsl(var(--chart-2))',
  },
  opportunities: {
    label: 'Pipeline',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function PipelineShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  return (
    <motion.div
      ref={ref}
      className="flex min-h-0 flex-col gap-2"
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: reduceMotion ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <ChartContainer
        config={chartConfig}
        className={cn('aspect-[16/7] w-full')}
      >
        <BarChart
          accessibilityLayer
          data={pipelineDetailed.thisMonth}
          margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
        >
          <CartesianGrid vertical={false} className="stroke-border/40" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[10px]"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
            className="text-[10px]"
          />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: 10, paddingBottom: 4 }}
            formatter={(value) => (
              <span className="text-muted-foreground">{String(value)}</span>
            )}
          />
          <Bar
            name="Available"
            dataKey="available"
            fill="var(--color-available)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            name="Pipeline"
            dataKey="opportunities"
            fill="var(--color-opportunities)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ChartContainer>
    </motion.div>
  );
}
