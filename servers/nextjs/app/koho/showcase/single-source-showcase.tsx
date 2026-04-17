'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Activity, CheckCircle2, Database, RefreshCw } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Card } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

import { dataFeedItems, dataSources, unifiedMetrics } from './showcase-data';

const sourceColors: Record<string, string> = {
  Nexudus: 'bg-[hsl(var(--chart-1)/0.15)] text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1)/0.3)]',
  HubSpot: 'bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3)/0.3)]',
  Xero: 'bg-[hsl(var(--chart-5)/0.15)] text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5)/0.3)]',
};

export function SingleSourceShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const [visibleFeedIdx, setVisibleFeedIdx] = useState(-1);

  useEffect(() => {
    if (!inView) return;

    let idx = 0;
    const initial = setTimeout(() => {
      setVisibleFeedIdx(0);
      idx = 1;

      const interval = setInterval(() => {
        if (idx < dataFeedItems.length) {
          setVisibleFeedIdx(idx);
          idx++;
        } else {
          idx = 0;
          setVisibleFeedIdx(0);
        }
      }, 2200);

      return () => clearInterval(interval);
    }, 400);

    return () => clearTimeout(initial);
  }, [inView]);

  const visibleItems = dataFeedItems.slice(0, visibleFeedIdx + 1).slice(-3);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      {/* Data sources row */}
      <div className="flex flex-wrap gap-2">
        {dataSources.map((src, i) => (
          <motion.div
            key={src.name}
            initial={animate ? { opacity: 0, scale: 0.9 } : false}
            animate={animate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: i * 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="flex items-center gap-2 border-border/60 px-3 py-2 shadow-none">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ backgroundColor: `${src.color}20` }}
              >
                <Database className="h-3.5 w-3.5" style={{ color: src.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">{src.name}</p>
                <p className="text-[10px] text-muted-foreground">{src.type} · {src.records}</p>
              </div>
              <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-[hsl(var(--status-healthy))]" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live data feed */}
      <motion.div
        initial={animate ? { opacity: 0 } : false}
        animate={animate ? { opacity: 1 } : undefined}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <Card className="overflow-hidden border-border/60 shadow-none">
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-1.5">
            <Activity className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live Data Feed
            </span>
            <RefreshCw className="ml-auto h-3 w-3 animate-spin text-muted-foreground/50 [animation-duration:3s]" />
          </div>
          <div className="flex flex-col divide-y divide-border/30">
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item) => (
                <motion.div
                  key={`${item.source}-${item.event}-${item.detail}`}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-[9px] font-semibold', sourceColors[item.source])}
                  >
                    {item.source}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium">{item.event}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[9px] tabular-nums text-muted-foreground/60">
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Unified metrics bar */}
      <motion.div
        className="grid grid-cols-4 gap-1.5"
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.5, duration: 0.35 }}
      >
        {unifiedMetrics.map((m) => (
          <div
            key={m.label}
            className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1.5 text-center"
          >
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className="text-xs font-semibold tabular-nums">{m.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
