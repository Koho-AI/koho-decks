'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';
import { pipelineDetailed, pipelineSummaries } from './showcase-data';

const timeframes = ['thisMonth', 'oneToThreeMonths', 'threeToSixMonths'] as const;
const timeframeLabels: Record<(typeof timeframes)[number], string> = {
  thisMonth: 'This Month',
  oneToThreeMonths: '1-3 Months',
  threeToSixMonths: '3-6 Months',
};

const chartConfig = {
  available: { label: 'Available', color: 'hsl(var(--chart-2))' },
  opportunities: { label: 'Opportunities', color: 'hsl(var(--chart-1))' },
  leads: { label: 'Leads', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

export function PipelineMatchingShowcase() {
  const [activeTab, setActiveTab] = useState<(typeof timeframes)[number]>('thisMonth');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const idx = timeframes.indexOf(prev);
        return timeframes[(idx + 1) % timeframes.length]!;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const data = pipelineDetailed[activeTab];
  const summary = pipelineSummaries[activeTab];

  return (
    <Card className="flex w-full max-w-4xl flex-col overflow-hidden border-border/60 bg-card/80 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
        <div
          className="flex flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
          role="tablist"
        >
          {timeframes.map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={activeTab === tf}
              onClick={() => setActiveTab(tf)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === tf
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {timeframeLabels[tf]}
            </button>
          ))}
        </div>

        <div className="aspect-[16/10] min-h-[220px] w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="h-full w-full"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  data={data}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 12 }}
                    formatter={(value) => (
                      <span className="text-muted-foreground text-xs">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="available"
                    fill="var(--color-available)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="opportunities"
                    fill="var(--color-opportunities)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="leads"
                    fill="var(--color-leads)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{summary.units}</span> Units —{' '}
          <span className="font-medium text-foreground">{summary.deals}</span> Deals —{' '}
          <span className="font-medium text-foreground">{summary.leads}</span> Leads
        </p>
      </CardContent>
    </Card>
  );
}
