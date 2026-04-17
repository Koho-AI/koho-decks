'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  Home,
  LayoutDashboard,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@kit/ui/badge';
import { ChartConfig, ChartContainer } from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import { portfolioKPIs, portfolioMRRTrend } from './showcase-data';

type RoleKey = 'overview' | 'sales' | 'operations' | 'community' | 'finance' | 'leadership';

const roleViews: { key: RoleKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'sales', label: 'Sales', icon: Briefcase },
  { key: 'operations', label: 'Operations', icon: Building2 },
  { key: 'community', label: 'Community', icon: Users },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'leadership', label: 'Leadership', icon: TrendingUp },
];

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const chartConfig = {
  value: { label: 'MRR', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const roleKPIs: Record<RoleKey, { label: string; value: string; delta: string }[]> = {
  overview: [
    { label: 'Total MRR', value: '£287,450', delta: '+4.2%' },
    { label: 'Occupancy', value: '87.3%', delta: '+2.1%' },
    { label: 'Active Clients', value: '342', delta: '+12' },
    { label: 'Revenue at Risk', value: '£18.2k', delta: '-15.3%' },
  ],
  sales: [
    { label: 'Pipeline Value', value: '£142k', delta: '+18%' },
    { label: 'Active Deals', value: '27', delta: '+5' },
    { label: 'Win Rate', value: '34%', delta: '+6%' },
    { label: 'Avg Close Time', value: '18d', delta: '-3d' },
  ],
  operations: [
    { label: 'Occupancy', value: '87.3%', delta: '+2.1%' },
    { label: 'Utilisation', value: '72%', delta: '+4%' },
    { label: 'Locations', value: '4', delta: '—' },
    { label: 'Capacity', value: '1,240', delta: '+80' },
  ],
  community: [
    { label: 'Member Health', value: '72', delta: '+4' },
    { label: 'Renewals (90d)', value: '24', delta: '+3' },
    { label: 'Churn Rate', value: '3.2%', delta: '-1.1%' },
    { label: 'NPS Score', value: '64', delta: '+6' },
  ],
  finance: [
    { label: 'Total MRR', value: '£287,450', delta: '+4.2%' },
    { label: 'Cash Collection', value: '96.8%', delta: '+1.2%' },
    { label: 'Overdue AR', value: '£8,400', delta: '-22%' },
    { label: 'Net Margin', value: '37.1%', delta: '+2.4%' },
  ],
  leadership: [
    { label: 'Portfolio MRR', value: '£287,450', delta: '+4.2%' },
    { label: 'Occupancy', value: '87.3%', delta: '+2.1%' },
    { label: 'Revenue at Risk', value: '£18.2k', delta: '-15.3%' },
    { label: 'NPS', value: '64', delta: '+6' },
  ],
};

const activityFeed = [
  { role: 'sales', text: 'New deal: Acme Corp — 12 desks @ £4,200/mo', time: '2m', color: 'text-[hsl(var(--chart-3))]' },
  { role: 'operations', text: 'Kings Cross occupancy hit 94%', time: '8m', color: 'text-[hsl(var(--chart-5))]' },
  { role: 'community', text: 'NPS survey: 4 responses, avg score 72', time: '15m', color: 'text-[hsl(var(--chart-1))]' },
  { role: 'finance', text: 'Xero sync complete — 24 invoices matched', time: '22m', color: 'text-[hsl(var(--chart-4))]' },
  { role: 'sales', text: 'Deal won: Globex Inc upgraded to 6 desks', time: '35m', color: 'text-[hsl(var(--chart-3))]' },
  { role: 'operations', text: 'Manchester meeting room utilisation: 68%', time: '42m', color: 'text-[hsl(var(--chart-5))]' },
  { role: 'community', text: 'Risk alert: Wayne Enterprises usage declining', time: '1h', color: 'text-[hsl(var(--chart-2))]' },
  { role: 'leadership', text: 'Board pack auto-generated for Q1 review', time: '1h', color: 'text-[hsl(var(--chart-6))]' },
];

const locationBars = [
  { name: 'Kings Cross', occupancy: 94, revenue: 98 },
  { name: 'Shoreditch', occupancy: 88, revenue: 82 },
  { name: 'Manchester', occupancy: 79, revenue: 64 },
  { name: 'Bristol', occupancy: 84, revenue: 43 },
];

const barConfig = {
  occupancy: { label: 'Occupancy %', color: 'hsl(var(--chart-1))' },
  revenue: { label: 'MRR (£k)', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

export function SolutionsDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const [activeRole, setActiveRole] = useState<RoleKey>('overview');
  const [visibleFeedIdx, setVisibleFeedIdx] = useState(-1);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const keys: RoleKey[] = ['overview', 'sales', 'operations', 'community', 'finance', 'leadership'];
    let idx = 0;
    const t = setInterval(() => {
      idx = (idx + 1) % keys.length;
      setActiveRole(keys[idx]!);
    }, 4000);
    return () => clearInterval(t);
  }, [inView, reduceMotion]);

  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const initial = setTimeout(() => {
      setVisibleFeedIdx(0);
      idx = 1;
      const interval = setInterval(() => {
        if (idx < activityFeed.length) {
          setVisibleFeedIdx(idx);
          idx++;
        } else {
          idx = 0;
          setVisibleFeedIdx(0);
        }
      }, 2200);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(initial);
  }, [inView]);

  const visibleItems = activityFeed.slice(0, visibleFeedIdx + 1).slice(-4);

  const numericTrend = portfolioMRRTrend.map((d) => ({
    name: d.name,
    value: Number(d.value),
  }));

  const kpis = roleKPIs[activeRole];
  const ActiveIcon = roleViews.find((r) => r.key === activeRole)?.icon ?? LayoutDashboard;

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
              item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground/60',
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
            <span className="text-xs font-semibold">Solutions</span>
            <span className="text-[10px] text-muted-foreground">/ Role Intelligence</span>
          </div>
          <div className="flex items-center gap-1">
            {roleViews.map((rv) => (
              <button
                key={rv.key}
                onClick={() => setActiveRole(rv.key)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[9px] font-medium transition-colors',
                  activeRole === rv.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {rv.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Dashboard body */}
        <div className="flex flex-col gap-3 p-3 sm:p-4">
          {/* Active role indicator + KPI row */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  className="rounded-lg border border-border/50 bg-card px-3 py-2"
                  initial={animate ? { opacity: 0, scale: 0.95 } : false}
                  animate={animate ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.2 }}
                >
                  <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold tabular-nums">{kpi.value}</span>
                    <span className={cn(
                      'text-[9px] font-medium tabular-nums',
                      kpi.delta.startsWith('-') || kpi.delta === '—'
                        ? kpi.delta === '—' ? 'text-muted-foreground' : 'text-[hsl(var(--status-healthy))]'
                        : 'text-[hsl(var(--status-healthy))]',
                    )}>
                      {kpi.delta}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Chart + Activity feed row */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {/* MRR chart */}
            <motion.div
              className="sm:col-span-3 rounded-lg border border-border/50 bg-card p-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.4, duration: 0.35 }}
            >
              <div className="mb-1 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <ActiveIcon className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">Revenue Trend</span>
                </div>
                <span className="text-[9px] text-muted-foreground">12 months</span>
              </div>
              <div className="h-[120px] sm:h-[140px] min-h-0 overflow-hidden">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={numericTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="solFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9 }}
                      tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#solFill)"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </motion.div>

            {/* Activity feed */}
            <motion.div
              className="sm:col-span-2 rounded-lg border border-border/50 bg-card p-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, duration: 0.35 }}
            >
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold">Live Feed</span>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 animate-pulse border-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy))]">
                  Live
                </Badge>
              </div>
              <div className="h-[120px] sm:h-[140px] min-h-0 overflow-hidden flex flex-col gap-1">
                <AnimatePresence mode="popLayout">
                  {visibleItems.map((item, i) => (
                    <motion.div
                      key={`${item.text}-${i}`}
                      layout
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-1.5 rounded-md bg-muted/30 px-2 py-1.5"
                    >
                      <CheckCircle2 className={cn('mt-0.5 h-3 w-3 shrink-0', item.color)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-medium leading-tight">{item.text}</p>
                        <p className="text-[9px] text-muted-foreground">{item.time} ago</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Location summary bars */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card p-2"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.6, duration: 0.35 }}
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold">Location Performance</span>
              <span className="text-[9px] text-muted-foreground">Occupancy % &middot; Revenue £k</span>
            </div>
            <div className="h-[80px] min-h-0 overflow-hidden">
              <ChartContainer config={barConfig} className="h-full w-full">
                <BarChart data={locationBars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                  <Bar dataKey="occupancy" fill="var(--color-occupancy)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ChartContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
