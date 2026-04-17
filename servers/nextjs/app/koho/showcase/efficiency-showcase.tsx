'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent } from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { efficiencyKPIs, efficiencyTrend } from './showcase-data';

const chartConfig = {
  manual: { label: 'Manual hours', color: 'hsl(var(--chart-2))' },
  automated: { label: 'Automated hours', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

export function EfficiencyShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: '-24px' });
  const reduce = useReducedMotion();
  const animate = inView && !reduce;

  return (
    <Card ref={rootRef} className="w-full max-w-3xl border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {efficiencyKPIs.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animate ? i * 0.08 : 0, duration: 0.35 }}
            >
              <Card className="border-border/50 shadow-none">
                <CardContent className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {kpi.label}
                    </span>
                    {'badge' in kpi && kpi.badge ? (
                      <Badge variant={kpi.badgeVariant ?? 'secondary'} className="text-[9px]">
                        {kpi.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-lg font-semibold tabular-nums">{kpi.value}</p>
                  {'delta' in kpi && kpi.delta != null ? (
                    <p className="text-[11px] font-medium text-[hsl(var(--delta-positive))]">
                      +{kpi.delta}% vs prior
                    </p>
                  ) : null}
                  {'subtext' in kpi && kpi.subtext ? (
                    <p className="text-[11px] text-muted-foreground">{kpi.subtext}</p>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: animate ? 0.28 : 0, duration: 0.45 }}
        >
          <ChartContainer config={chartConfig} className="aspect-[16/9] h-[200px] w-full max-h-[240px]">
            <BarChart
              accessibilityLayer
              data={efficiencyTrend}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={28} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="manual" fill="var(--color-manual)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar
                dataKey="automated"
                fill="var(--color-automated)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ChartContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}
