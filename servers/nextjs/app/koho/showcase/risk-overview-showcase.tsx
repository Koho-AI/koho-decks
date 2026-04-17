'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Card } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

import { riskSignals, riskTreemapData } from './showcase-data';

function riskScoreClass(score: number, highlighted: boolean) {
  const base = score < 40
    ? 'border-[hsl(var(--status-danger)/0.25)] bg-[hsl(var(--status-danger)/0.15)]'
    : score < 70
      ? 'border-[hsl(var(--status-warning)/0.25)] bg-[hsl(var(--status-warning)/0.15)]'
      : 'border-[hsl(var(--status-healthy)/0.25)] bg-[hsl(var(--status-healthy)/0.15)]';

  if (highlighted) {
    const ring = score < 40
      ? 'ring-2 ring-[hsl(var(--status-danger)/0.5)]'
      : score < 70
        ? 'ring-2 ring-[hsl(var(--status-warning)/0.5)]'
        : 'ring-2 ring-[hsl(var(--status-healthy)/0.5)]';
    return `${base} ${ring}`;
  }

  return base;
}

function levelBadgeVariant(level: 'danger' | 'warning' | 'healthy') {
  if (level === 'danger') return 'danger' as const;
  if (level === 'warning') return 'warning' as const;
  return 'success' as const;
}

function levelLabel(level: 'danger' | 'warning' | 'healthy') {
  if (level === 'danger') return 'Critical';
  if (level === 'warning') return 'Watch';
  return 'Healthy';
}

function signalIcon(level: 'danger' | 'warning' | 'healthy') {
  if (level === 'danger') return AlertTriangle;
  if (level === 'warning') return ShieldAlert;
  return TrendingUp;
}

export function RiskOverviewShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const [activeSignalIdx, setActiveSignalIdx] = useState(-1);
  const [showAction, setShowAction] = useState(false);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const HIGHLIGHT_DURATION = 2800;
    const ACTION_DELAY = 1200;
    const totalCycle = riskSignals.length * HIGHLIGHT_DURATION;

    let frame: ReturnType<typeof setTimeout>;
    let actionFrame: ReturnType<typeof setTimeout>;

    function cycle() {
      let i = 0;
      function step() {
        setActiveSignalIdx(i);
        setShowAction(false);

        actionFrame = setTimeout(() => setShowAction(true), ACTION_DELAY);

        i = (i + 1) % riskSignals.length;
        frame = setTimeout(step, HIGHLIGHT_DURATION);
      }
      step();
    }

    const startDelay = setTimeout(cycle, 800);
    return () => {
      clearTimeout(startDelay);
      clearTimeout(frame);
      clearTimeout(actionFrame);
    };
  }, [inView, reduceMotion]);

  const totalMrr = riskTreemapData.reduce((s, x) => s + x.mrr, 0);
  const sortedTreemap = [...riskTreemapData].sort((a, b) => b.mrr - a.mrr);

  const activeSignal = activeSignalIdx >= 0 ? riskSignals[activeSignalIdx] : null;
  const highlightedCompany = activeSignal?.company ?? null;

  return (
    <div ref={ref} className="flex min-h-0 flex-col gap-3 h-[320px] overflow-hidden">
      {/* Treemap grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {sortedTreemap.map((item, i) => (
          <motion.div
            key={item.name}
            className={cn(
              'flex flex-col justify-center rounded-md border px-2 py-1.5 transition-all duration-300',
              riskScoreClass(item.riskScore, item.name === highlightedCompany),
              item.name === highlightedCompany && 'scale-[1.02]',
            )}
            initial={animate ? { opacity: 0, scale: 0.92 } : false}
            animate={animate ? { opacity: 1, scale: 1 } : undefined}
            transition={{
              duration: reduceMotion ? 0 : 0.35,
              delay: reduceMotion ? 0 : i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="truncate text-[11px] font-semibold leading-tight text-foreground">
              {item.name}
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              £{(item.mrr / 1000).toFixed(1)}k MRR
            </span>
          </motion.div>
        ))}
      </div>

      {/* Cycling signal card */}
      <div className="relative min-h-[72px]">
        <AnimatePresence mode="wait">
          {activeSignal && (
            <motion.div
              key={activeSignal.company}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="border-border/80 shadow-none">
                <div className="flex items-center gap-2 p-2.5">
                  {(() => {
                    const Icon = signalIcon(activeSignal.level);
                    const DeltaIcon = activeSignal.delta < 0 ? TrendingDown : TrendingUp;
                    return (
                      <>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold">{activeSignal.company}</span>
                            <Badge variant={levelBadgeVariant(activeSignal.level)} className="text-[10px]">
                              {levelLabel(activeSignal.level)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Icon className="h-3 w-3 shrink-0" />
                            <span>{activeSignal.signal}</span>
                            <span className={cn(
                              'ml-auto font-semibold tabular-nums',
                              activeSignal.delta < 0
                                ? 'text-[hsl(var(--delta-negative))]'
                                : 'text-[hsl(var(--delta-positive))]',
                            )}>
                              <DeltaIcon className="mr-0.5 inline h-3 w-3" />
                              {activeSignal.mrrImpact}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI recommendation */}
      <AnimatePresence>
        {showAction && activeSignal && (
          <motion.div
            key={`action-${activeSignal.company}`}
            initial={{ opacity: 0, y: 4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-primary">Recommended action</p>
                <p className="text-[11px] leading-snug text-foreground/80">
                  {activeSignal.action}
                </p>
              </div>
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
