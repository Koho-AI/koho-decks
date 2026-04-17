'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Database,
  Home,
  LayoutDashboard,
  LineChart,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@kit/ui/badge';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import {
  dataFeedItems,
  dataSources,
  portfolioKPIs,
  portfolioMRRTrend,
  unifiedMetrics,
} from './showcase-data';

const chartConfig = {
  value: { label: 'MRR', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const sourceColors: Record<string, string> = {
  Nexudus: 'bg-[hsl(var(--chart-1)/0.15)] text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1)/0.3)]',
  HubSpot: 'bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3)/0.3)]',
  Xero: 'bg-[hsl(var(--chart-5)/0.15)] text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5)/0.3)]',
};

const tableRows = [
  { company: 'Acme Corp', type: '12 desks', mrr: '£4,200', status: 'Active', source: 'Nexudus' },
  { company: 'Globex Inc', type: '6 desks', mrr: '£3,100', status: 'Active', source: 'HubSpot' },
  { company: 'Initech', type: '8 desks', mrr: '£5,400', status: 'Active', source: 'Xero' },
  { company: 'Wayne Enterprises', type: '4 desks', mrr: '£1,950', status: 'At Risk', source: 'Nexudus' },
  { company: 'Stark Industries', type: '10 desks', mrr: '£2,800', status: 'Active', source: 'HubSpot' },
  { company: 'Umbrella Corp', type: 'Hot Desk', mrr: '£6,200', status: 'Active', source: 'Xero' },
  { company: 'Hooli', type: '3 desks', mrr: '£3,800', status: 'Active', source: 'Nexudus' },
  { company: 'Pied Piper', type: '2 desks', mrr: '£2,600', status: 'Active', source: 'HubSpot' },
];

export function SingleSourceDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
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
      }, 2400);

      return () => clearInterval(interval);
    }, 600);

    return () => clearTimeout(initial);
  }, [inView]);

  const visibleItems = dataFeedItems.slice(0, visibleFeedIdx + 1).slice(-3);

  const numericTrend = portfolioMRRTrend.map((d) => ({
    name: d.name,
    value: Number(d.value),
  }));

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
            <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Dashboard</span>
            <span className="text-[10px] text-muted-foreground">/ Portfolio Overview</span>
          </div>
          <div className="flex items-center gap-2">
            {dataSources.map((src) => (
              <div
                key={src.name}
                className="flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5"
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: src.color }}
                />
                <span className="text-[9px] font-medium text-muted-foreground">{src.name}</span>
                <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--status-healthy))]" />
              </div>
            ))}
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
            {portfolioKPIs.map((kpi, i) => (
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
                  <span
                    className={cn(
                      'text-[9px] font-medium tabular-nums',
                      kpi.trend.sentiment === 'positive'
                        ? 'text-[hsl(var(--status-healthy))]'
                        : 'text-[hsl(var(--status-danger))]',
                    )}
                  >
                    {kpi.trend.direction === 'up' ? '+' : ''}
                    {kpi.trend.delta}
                    {kpi.trend.isPercentage ? '%' : ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Chart + Activity feed row */}
          <div className="grid h-[280px] grid-cols-1 gap-3 sm:h-[360px] sm:grid-cols-5">
            {/* MRR Chart */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-3"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">MRR Trend</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Last 12 months</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={numericTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="heroMrr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#heroMrr)"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </motion.div>

            {/* Live activity feed */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <Activity className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Live Feed</span>
                <RefreshCw className="ml-auto h-2.5 w-2.5 animate-spin text-muted-foreground/40 [animation-duration:3s]" />
              </div>
              <div className="flex min-h-0 flex-1 flex-col divide-y divide-border/20 overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {visibleItems.map((item) => (
                    <motion.div
                      key={`${item.source}-${item.event}-${item.detail}`}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-1.5 px-3 py-2"
                    >
                      <Badge
                        variant="outline"
                        className={cn('mt-0.5 shrink-0 text-[8px] font-semibold', sourceColors[item.source])}
                      >
                        {item.source}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-medium leading-tight">{item.event}</p>
                        <p className="truncate text-[9px] text-muted-foreground">{item.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Data table */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.7, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Unified Client View</span>
              </div>
              <div className="flex gap-2">
                {unifiedMetrics.slice(0, 2).map((m) => (
                  <span key={m.label} className="text-[9px] text-muted-foreground">
                    {m.label}: <span className="font-medium text-foreground">{m.value}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="px-3 py-1.5 text-left font-medium">Company</th>
                    <th className="px-3 py-1.5 text-left font-medium">Type</th>
                    <th className="px-3 py-1.5 text-right font-medium">MRR</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Status</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <motion.tr
                      key={row.company}
                      className="border-b border-border/10 last:border-b-0"
                      initial={animate ? { opacity: 0 } : false}
                      animate={animate ? { opacity: 1 } : undefined}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}
                    >
                      <td className="px-3 py-1.5 font-medium">{row.company}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.type}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{row.mrr}</td>
                      <td className="hidden px-3 py-1.5 sm:table-cell">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium',
                            row.status === 'Active'
                              ? 'bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))]'
                              : 'bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]',
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="hidden px-3 py-1.5 sm:table-cell">
                        <Badge
                          variant="outline"
                          className={cn('text-[8px]', sourceColors[row.source])}
                        >
                          {row.source}
                        </Badge>
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
