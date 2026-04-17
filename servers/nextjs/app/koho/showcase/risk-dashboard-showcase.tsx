'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Home,
  LayoutDashboard,
  LineChart,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@kit/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import {
  renewalPipeline,
  riskKPIs,
  riskSignals,
  riskTimeline,
} from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk', active: true },
  { icon: Settings, label: 'Settings' },
];

const chartConfig = {
  atRisk: { label: 'At Risk', color: 'hsl(var(--chart-4))' },
  mitigated: { label: 'Mitigated', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

function healthColor(score: number) {
  if (score < 40) return 'bg-[hsl(var(--status-danger))]';
  if (score < 60) return 'bg-[hsl(var(--status-warning))]';
  return 'bg-[hsl(var(--status-healthy))]';
}

function statusStyle(status: 'Critical' | 'Watch' | 'Stable') {
  if (status === 'Critical') return 'bg-[hsl(var(--status-danger)/0.1)] text-[hsl(var(--status-danger))]';
  if (status === 'Watch') return 'bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]';
  return 'bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))]';
}

export function RiskDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const [activeSignalIdx, setActiveSignalIdx] = useState(-1);
  const [showAction, setShowAction] = useState(false);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const HIGHLIGHT_DURATION = 3200;
    const ACTION_DELAY = 1400;
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

    const startDelay = setTimeout(cycle, 1000);
    return () => {
      clearTimeout(startDelay);
      clearTimeout(frame);
      clearTimeout(actionFrame);
    };
  }, [inView, reduceMotion]);

  const activeSignal = activeSignalIdx >= 0 ? riskSignals[activeSignalIdx] : null;

  return (
    <div ref={ref} className="flex overflow-hidden rounded-md bg-background text-foreground">
      {/* Sidebar */}
      <motion.div
        className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border/40 bg-muted/30 py-3 sm:flex"
        initial={animate ? { x: -48, opacity: 0 } : false}
        animate={animate ? { x: 0, opacity: 1 } : undefined}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-[10px] font-bold text-primary-foreground">K</span>
        </div>
        {navItems.map((item, i) => (
          <motion.div
            key={item.label}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              item.active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            initial={animate ? { opacity: 0, x: -12 } : false}
            animate={animate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
          >
            <item.icon className="h-3.5 w-3.5" />
          </motion.div>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header bar */}
        <motion.div
          className="flex items-center justify-between border-b border-border/40 px-3 py-2 sm:px-4"
          initial={animate ? { opacity: 0, y: -8 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Revenue Risk</span>
            <span className="text-[10px] text-muted-foreground">/ Portfolio Overview</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-[hsl(var(--status-danger)/0.1)] px-2 py-0.5 text-[9px] font-medium text-[hsl(var(--status-danger))]">
              3 Critical
            </span>
            <span className="rounded-full bg-[hsl(var(--status-warning)/0.1)] px-2 py-0.5 text-[9px] font-medium text-[hsl(var(--status-warning))]">
              5 Watch
            </span>
          </div>
        </motion.div>

        {/* Dashboard body */}
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {/* KPI row */}
          <motion.div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            {riskKPIs.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                className="rounded-lg border border-border/50 bg-card px-3 py-2"
                initial={animate ? { opacity: 0, scale: 0.95 } : false}
                animate={animate ? { opacity: 1, scale: 1 } : undefined}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.25 }}
              >
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-sm font-semibold tabular-nums sm:text-base">{kpi.value}</p>
                  <span className="text-[9px] font-medium tabular-nums text-[hsl(var(--status-healthy))]">
                    {kpi.delta}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Chart + AI alerts row */}
          <div className="grid h-[280px] grid-cols-1 gap-3 sm:h-[360px] sm:grid-cols-5">
            {/* Risk trend chart */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-3"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">Risk Trend</span>
                </div>
                <span className="text-[9px] text-muted-foreground">At Risk vs Mitigated</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={riskTimeline} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mitigatedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="atRisk"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      fill="url(#riskFill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="mitigated"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#mitigatedFill)"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </motion.div>

            {/* AI risk alerts */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">AI Insights</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-3 py-2">
                <AnimatePresence mode="wait">
                  {activeSignal && (
                    <motion.div
                      key={activeSignal.company}
                      className="flex flex-col gap-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold">{activeSignal.company}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[8px]',
                            activeSignal.level === 'danger'
                              ? 'border-[hsl(var(--status-danger)/0.3)] bg-[hsl(var(--status-danger)/0.1)] text-[hsl(var(--status-danger))]'
                              : activeSignal.level === 'warning'
                                ? 'border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]'
                                : 'border-[hsl(var(--status-healthy)/0.3)] bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))]',
                          )}
                        >
                          {activeSignal.signal}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Impact: <span className="font-medium text-foreground">{activeSignal.mrrImpact}</span>
                      </p>
                      <AnimatePresence>
                        {showAction && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-start gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
                              <ArrowRight className="mt-0.5 h-2.5 w-2.5 shrink-0 text-primary" />
                              <p className="text-[9px] leading-snug text-foreground/80">
                                {activeSignal.action}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Renewal pipeline table */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.7, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Renewal Pipeline</span>
              </div>
              <span className="text-[9px] text-muted-foreground">
                Upcoming breaks & renewals
              </span>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="px-3 py-1.5 text-left font-medium">Company</th>
                    <th className="px-3 py-1.5 text-right font-medium">MRR</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Break Date</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Health</th>
                    <th className="px-3 py-1.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {renewalPipeline.map((row, i) => (
                    <motion.tr
                      key={row.company}
                      className={cn(
                        'border-b border-border/10 last:border-b-0 transition-colors duration-300',
                        activeSignal?.company === row.company && 'bg-primary/5',
                      )}
                      initial={animate ? { opacity: 0 } : false}
                      animate={animate ? { opacity: 1 } : undefined}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}
                    >
                      <td className="px-3 py-1.5 font-medium">{row.company}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{row.mrr}</td>
                      <td className="hidden px-3 py-1.5 tabular-nums sm:table-cell">{row.breakDate}</td>
                      <td className="hidden px-3 py-1.5 sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="relative h-1.5 w-12 overflow-hidden rounded-full bg-muted/50">
                            <div
                              className={cn('absolute inset-y-0 left-0 rounded-full', healthColor(row.health))}
                              style={{ width: `${row.health}%` }}
                            />
                          </div>
                          <span className="text-[9px] tabular-nums">{row.health}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium',
                            statusStyle(row.status),
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
