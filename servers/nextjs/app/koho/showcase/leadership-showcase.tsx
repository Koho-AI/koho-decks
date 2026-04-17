'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent } from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';
import { leadershipKPIs, locationStatuses, quarterlyMRR } from './showcase-data';

const mrrChartConfig = {
  actual: { label: 'Actual MRR', color: 'hsl(var(--chart-1))' },
  target: { label: 'Target', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig;

function formatMrrTick(n: number) {
  if (n >= 1000) return `${n / 1000}k`;
  return `${n}`;
}

export function LeadershipShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: '-24px' });
  const reduce = useReducedMotion();
  const animate = inView && !reduce;

  return (
    <Card ref={rootRef} className="w-full max-w-4xl border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {leadershipKPIs.map((kpi, i) => {
            const up = kpi.delta > 0;
            const good = kpi.invert ? !up : up;
            return (
              <motion.div
                key={kpi.label}
                initial={animate ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animate ? i * 0.05 : 0, duration: 0.35 }}
              >
                <Card className="border-border/50 shadow-none">
                  <CardContent className="space-y-1 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {kpi.label}
                    </span>
                    <p className="text-lg font-semibold tabular-nums leading-tight">{kpi.value}</p>
                    <p
                      className={cn(
                        'text-[11px] font-medium',
                        good
                          ? 'text-[hsl(var(--delta-positive))]'
                          : 'text-[hsl(var(--delta-negative))]',
                      )}
                    >
                      {kpi.delta > 0 ? '+' : ''}
                      {kpi.delta}
                      {kpi.suffix === 'x' ? 'x' : '%'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={animate ? { opacity: 0, scaleY: 0.96 } : false}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: animate ? 0.2 : 0, duration: 0.45 }}
          style={{ transformOrigin: 'bottom' }}
        >
          <ChartContainer config={mrrChartConfig} className="h-[220px] w-full">
            <BarChart
              accessibilityLayer
              data={quarterlyMRR}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="quarter" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={44}
                tickFormatter={formatMrrTick}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(v) => (
                      <span className="tabular-nums">
                        £{Number(v).toLocaleString()}
                      </span>
                    )}
                  />
                }
              />
              <Legend
                wrapperStyle={{ paddingTop: 4 }}
                formatter={(v) => <span className="text-muted-foreground text-xs">{v}</span>}
              />
              <Bar
                dataKey="actual"
                fill="var(--color-actual)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                isAnimationActive={animate}
                animationDuration={900}
              />
              <Bar
                dataKey="target"
                fill="var(--color-target)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                fillOpacity={0.55}
                isAnimationActive={animate}
                animationDuration={900}
              />
            </BarChart>
          </ChartContainer>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2">
          {locationStatuses.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={animate ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animate ? 0.35 + i * 0.06 : 0, duration: 0.35 }}
            >
              <Badge
                variant="outline"
                className="gap-1.5 border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-normal"
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    loc.level === 'healthy' && 'bg-[hsl(var(--status-healthy))]',
                    loc.level === 'warning' && 'bg-[hsl(var(--status-warning))]',
                    loc.level === 'danger' && 'bg-[hsl(var(--status-danger))]',
                  )}
                />
                {loc.name}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
