'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Home,
  LayoutDashboard,
  LineChart,
  Loader2,
  Settings,
  Shield,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@kit/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import {
  automationLog,
  efficiencyDashKPIs,
  efficiencyTrend,
} from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk' },
  { icon: Zap, label: 'Automation', active: true },
  { icon: Settings, label: 'Settings' },
];

const chartConfig = {
  manual: { label: 'Manual', color: 'hsl(var(--chart-2))' },
  automated: { label: 'Automated', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

function statusIcon(status: 'Completed' | 'Running' | 'Scheduled') {
  if (status === 'Completed') return CheckCircle2;
  if (status === 'Running') return Loader2;
  return Clock;
}

function statusStyle(status: 'Completed' | 'Running' | 'Scheduled') {
  if (status === 'Completed') return 'text-[hsl(var(--status-healthy))]';
  if (status === 'Running') return 'text-primary animate-spin [animation-duration:2s]';
  return 'text-muted-foreground/60';
}

export function EfficiencyDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

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
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Automation</span>
            <span className="text-[10px] text-muted-foreground">/ Efficiency Overview</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--status-healthy)/0.1)] px-2 py-0.5 text-[9px] font-medium text-[hsl(var(--status-healthy))]">
              <CheckCircle2 className="h-2.5 w-2.5" />
              All systems synced
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
            {efficiencyDashKPIs.map((kpi, i) => (
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

          {/* Chart + time saved breakdown row */}
          <div className="grid h-[280px] grid-cols-1 gap-3 sm:h-[360px] sm:grid-cols-5">
            {/* Manual vs automated chart */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-3"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">Manual vs Automated</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Hours per month</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={efficiencyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
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
                      width={24}
                    />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="manual" fill="var(--color-manual)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="automated" fill="var(--color-automated)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ChartContainer>
              </div>
            </motion.div>

            {/* Time saved by category */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <Timer className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Time Saved by Area</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden px-3 py-2">
                {[
                  { area: 'Reporting', hours: 18, max: 20 },
                  { area: 'Data Entry', hours: 12, max: 20 },
                  { area: 'Reconciliation', hours: 8, max: 20 },
                  { area: 'Workflows', hours: 6, max: 20 },
                  { area: 'Comms', hours: 4, max: 20 },
                ].map((item, i) => (
                  <motion.div
                    key={item.area}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.65 + i * 0.06, duration: 0.25 }}
                  >
                    <span className="w-20 shrink-0 truncate text-[9px] text-muted-foreground">
                      {item.area}
                    </span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-[hsl(var(--chart-5)/0.6)]"
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${(item.hours / item.max) * 100}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[9px] tabular-nums font-medium">
                      {item.hours} hrs
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Automation log table */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.7, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Automation Log</span>
              </div>
              <span className="text-[9px] text-muted-foreground">Today</span>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="px-3 py-1.5 text-left font-medium">Task</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Type</th>
                    <th className="px-3 py-1.5 text-right font-medium">Time Saved</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Time</th>
                    <th className="px-3 py-1.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {automationLog.map((row, i) => {
                    const StatusIcon = statusIcon(row.status);
                    return (
                      <motion.tr
                        key={row.task}
                        className="border-b border-border/10 last:border-b-0"
                        initial={animate ? { opacity: 0 } : false}
                        animate={animate ? { opacity: 1 } : undefined}
                        transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}
                      >
                        <td className="px-3 py-1.5 font-medium">{row.task}</td>
                        <td className="hidden px-3 py-1.5 sm:table-cell">
                          <Badge variant="outline" className="text-[8px]">{row.type}</Badge>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[hsl(var(--status-healthy))]">
                          {row.saved}
                        </td>
                        <td className="hidden px-3 py-1.5 tabular-nums text-muted-foreground sm:table-cell">
                          {row.time}
                        </td>
                        <td className="px-3 py-1.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-medium">
                            <StatusIcon className={cn('h-2.5 w-2.5', statusStyle(row.status))} />
                            {row.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
