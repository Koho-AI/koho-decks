'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Building2,
  BarChart3,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Card, CardContent } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

import { portfolioKPIs } from './showcase-data';

const kpiIcons = [Building2, BarChart3, Users, ShieldAlert] as const;

export function PortfolioOverviewShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: '-20%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        {portfolioKPIs.map((kpi, i) => {
          const Icon = kpiIcons[i] ?? Building2;
          const TrendIcon =
            kpi.trend.direction === 'up' ? TrendingUp : TrendingDown;

          return (
            <motion.div
              key={kpi.label}
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: reduceMotion ? 0 : 0.35,
                delay: reduceMotion ? 0 : i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card className="border-border/60 shadow-none">
                <CardContent className="px-2.5 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {kpi.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-lg font-semibold tabular-nums tracking-tight">
                      {kpi.value}
                    </p>
                    <TrendIcon
                      className={cn(
                        'h-3 w-3 shrink-0',
                        kpi.trend.sentiment === 'positive'
                          ? 'text-[hsl(var(--delta-positive))]'
                          : 'text-[hsl(var(--delta-negative))]',
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
