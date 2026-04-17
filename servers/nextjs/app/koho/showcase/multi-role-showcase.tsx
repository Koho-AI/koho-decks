'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent } from '@kit/ui/card';
import { ChartConfig, ChartContainer } from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';
import { miniRoles } from './showcase-data';

const salesChartConfig = {
  available: { label: 'Available', color: 'hsl(var(--chart-2))' },
  pipeline: { label: 'Pipeline', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const roleOrder = ['sales', 'operations', 'finance', 'leadership'] as const;

export function MultiRoleShowcase() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setActive((i) => (i + 1) % roleOrder.length), 5000);
    return () => clearInterval(t);
  }, [reduce]);

  const financeTrend = miniRoles.finance.trend;
  const sparkMin = Math.min(...financeTrend);
  const sparkMax = Math.max(...financeTrend);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkW = 120;
  const sparkH = 36;
  const points = financeTrend
    .map((v, i) => {
      const x = (i / (financeTrend.length - 1 || 1)) * sparkW;
      const y = sparkH - ((v - sparkMin) / sparkRange) * (sparkH - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const opsPct = miniRoles.operations.percentage;
  const circumference = 2 * Math.PI * 18;
  const dash = (opsPct / 100) * circumference;

  return (
    <div className="grid w-full max-w-2xl grid-cols-2 gap-3">
      {roleOrder.map((key, idx) => {
        const isActive = idx === active;
        return (
          <motion.div
            key={key}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isActive && !reduce ? 1.02 : 1,
              boxShadow: isActive
                ? '0 0 0 1px hsl(var(--primary) / 0.35), 0 8px 24px hsl(var(--foreground) / 0.06)'
                : '0 0 0 0px transparent',
            }}
            transition={{ delay: reduce ? 0 : idx * 0.06, duration: 0.35 }}
            className="rounded-xl"
          >
            <Card
              className={cn(
                'h-full border-border/60 bg-card/90 shadow-sm transition-colors',
                isActive && 'ring-1 ring-primary/25',
              )}
            >
              <CardContent className="space-y-3 p-3">
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {miniRoles[key].label}
                </Badge>

                {key === 'sales' ? (
                  <>
                    <div className="h-[88px] w-full">
                      <ChartContainer config={salesChartConfig} className="h-full w-full">
                        <BarChart
                          data={miniRoles.sales.bars}
                          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                        >
                          <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
                          <YAxis hide />
                          <Bar dataKey="available" fill="var(--color-available)" radius={3} maxBarSize={16} />
                          <Bar dataKey="pipeline" fill="var(--color-pipeline)" radius={3} maxBarSize={16} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{miniRoles.sales.kpi}</p>
                  </>
                ) : null}

                {key === 'operations' ? (
                  <div className="flex items-center gap-3">
                    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0 -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        className="stroke-muted"
                        strokeWidth="5"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="hsl(var(--chart-5))"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference}`}
                      />
                    </svg>
                    <p className="text-xs font-medium text-muted-foreground">{miniRoles.operations.kpi}</p>
                  </div>
                ) : null}

                {key === 'finance' ? (
                  <div className="space-y-2">
                    <svg
                      width={sparkW}
                      height={sparkH}
                      viewBox={`0 0 ${sparkW} ${sparkH}`}
                      className="overflow-visible"
                    >
                      <polyline
                        fill="none"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={points}
                      />
                      {financeTrend.map((v, i) => {
                        const x = (i / (financeTrend.length - 1 || 1)) * sparkW;
                        const y = sparkH - ((v - sparkMin) / sparkRange) * (sparkH - 6) - 3;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={2.5}
                            className="fill-[hsl(var(--chart-1))] stroke-background"
                            strokeWidth={1}
                          />
                        );
                      })}
                    </svg>
                    <p className="text-xs font-medium text-muted-foreground">{miniRoles.finance.kpi}</p>
                  </div>
                ) : null}

                {key === 'leadership' ? (
                  <div className="flex flex-wrap gap-1.5">
                    {miniRoles.leadership.kpis.map((chip) => (
                      <span
                        key={chip.label}
                        className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-medium"
                      >
                        <span className="text-muted-foreground">{chip.label}</span>
                        <span className="ml-1 tabular-nums text-foreground">{chip.value}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
