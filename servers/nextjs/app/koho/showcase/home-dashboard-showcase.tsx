'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Home,
  LayoutDashboard,
  LineChart,
  MapPin,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
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
  riskSignals,
} from './showcase-data';

const chartConfig = {
  value: { label: 'MRR', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
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

const locationData = [
  { name: 'Kings Cross', occupancy: 91, mrr: '£98k', status: 'healthy' as const },
  { name: 'Shoreditch', occupancy: 88, mrr: '£82k', status: 'healthy' as const },
  { name: 'Manchester', occupancy: 79, mrr: '£64k', status: 'warning' as const },
  { name: 'Bristol', occupancy: 84, mrr: '£43k', status: 'healthy' as const },
  { name: 'Edinburgh', occupancy: 82, mrr: '£38k', status: 'healthy' as const },
];

const pipelineSnapshot = [
  { type: 'Hot Desks', available: 18, pipeline: 12 },
  { type: '1-5 Desks', available: 8, pipeline: 6 },
  { type: '6-10 Desks', available: 5, pipeline: 4 },
  { type: '11-15 Desks', available: 3, pipeline: 2 },
];

const recentDeals = [
  { company: 'Globex Inc', type: '6 desks', stage: 'Won', value: '£3,100/mo', source: 'HubSpot' },
  { company: 'Acme Corp', type: '12 desks', stage: 'Proposal', value: '£4,800/mo', source: 'Nexudus' },
  { company: 'Pied Piper', type: 'Hot Desk', stage: 'Negotiation', value: '£350/mo', source: 'HubSpot' },
  { company: 'Initech', type: '8 desks', stage: 'Won', value: '£3,200/mo', source: 'Xero' },
  { company: 'Hooli', type: '4 desks', stage: 'Viewing', value: '£1,800/mo', source: 'HubSpot' },
  { company: 'Stark Industries', type: '10 desks', stage: 'Proposal', value: '£5,200/mo', source: 'Nexudus' },
  { company: 'Wayne Enterprises', type: '3 desks', stage: 'Won', value: '£1,400/mo', source: 'Xero' },
  { company: 'Umbrella Corp', type: '16 desks', stage: 'Lead', value: '£7,600/mo', source: 'HubSpot' },
];

const teamCursors = [
  {
    name: 'Sarah C.',
    initials: 'SC',
    color: '#6366f1',
    delay: 1.5,
    path: [
      { x: '35%', y: '18%' },
      { x: '55%', y: '28%' },
      { x: '42%', y: '38%' },
      { x: '28%', y: '22%' },
      { x: '48%', y: '15%' },
    ],
    duration: 18,
  },
  {
    name: 'James W.',
    initials: 'JW',
    color: '#f59e0b',
    delay: 3.2,
    path: [
      { x: '72%', y: '52%' },
      { x: '58%', y: '60%' },
      { x: '80%', y: '48%' },
      { x: '65%', y: '55%' },
      { x: '75%', y: '42%' },
    ],
    duration: 20,
  },
  {
    name: 'Maria G.',
    initials: 'MG',
    color: '#10b981',
    delay: 5,
    path: [
      { x: '45%', y: '72%' },
      { x: '62%', y: '80%' },
      { x: '38%', y: '85%' },
      { x: '55%', y: '76%' },
      { x: '48%', y: '68%' },
    ],
    duration: 16,
  },
];

function CursorSvg({ color }: { color: string }) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
      <path
        d="M0.928711 0.771484L15.0713 10.2285L7.53564 11.7998L3.7998 18.5713L0.928711 0.771484Z"
        fill={color}
        stroke="white"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function stageStyle(stage: string) {
  if (stage === 'Won') return 'bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))]';
  if (stage === 'Proposal' || stage === 'Negotiation') return 'bg-primary/10 text-primary';
  return 'bg-muted text-muted-foreground';
}

export function HomeDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const [visibleFeedIdx, setVisibleFeedIdx] = useState(-1);
  const [activeRiskIdx, setActiveRiskIdx] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const initial = setTimeout(() => {
      setVisibleFeedIdx(0);
      idx = 1;
      interval = setInterval(() => {
        if (idx < dataFeedItems.length) {
          setVisibleFeedIdx(idx);
          idx++;
        } else {
          idx = 0;
          setVisibleFeedIdx(0);
        }
      }, 2800);
    }, 800);
    return () => {
      clearTimeout(initial);
      if (interval) clearInterval(interval);
    };
  }, [inView]);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    let frame: ReturnType<typeof setTimeout>;
    let i = 0;
    function step() {
      setActiveRiskIdx(i);
      i = (i + 1) % riskSignals.length;
      frame = setTimeout(step, 4000);
    }
    const start = setTimeout(step, 1200);
    return () => {
      clearTimeout(start);
      clearTimeout(frame);
    };
  }, [inView, reduceMotion]);

  const visibleItems = dataFeedItems.slice(0, visibleFeedIdx + 1).slice(-3);
  const activeRisk = activeRiskIdx >= 0 ? riskSignals[activeRiskIdx] : null;
  const numericTrend = portfolioMRRTrend.map((d) => ({ name: d.name, value: Number(d.value) }));

  return (
    <div ref={ref} className="relative flex overflow-hidden rounded-md bg-background text-foreground">
      {/* Collaborative cursors */}
      {animate && teamCursors.map((cursor) => (
        <motion.div
          key={cursor.name}
          className="pointer-events-none absolute z-30"
          initial={{ opacity: 0, left: cursor.path[0]!.x, top: cursor.path[0]!.y }}
          animate={{
            opacity: [0, 1, 1, 1, 1, 1, 0.8, 1],
            left: cursor.path.map((p) => p.x),
            top: cursor.path.map((p) => p.y),
          }}
          transition={{
            opacity: { delay: cursor.delay, duration: 1 },
            left: { delay: cursor.delay + 0.5, duration: cursor.duration, repeat: Infinity, ease: 'easeInOut' },
            top: { delay: cursor.delay + 0.5, duration: cursor.duration, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <CursorSvg color={cursor.color} />
          <motion.div
            className="ml-3 -mt-1 flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 shadow-lg"
            style={{ backgroundColor: cursor.color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: cursor.delay + 0.8, duration: 0.3 }}
          >
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[7px] font-bold text-white">
              {cursor.initials}
            </div>
            <span className="text-[8px] font-medium text-white whitespace-nowrap">{cursor.name}</span>
          </motion.div>
        </motion.div>
      ))}

      {/* Sidebar */}
      <motion.div
        className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border/40 bg-muted/30 py-3"
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
        {/* Header */}
        <motion.div
          className="flex items-center justify-between border-b border-border/40 px-4 py-2"
          initial={animate ? { opacity: 0, y: -8 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Home className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold">Home</span>
            <span className="text-[9px] text-muted-foreground">/ Portfolio Command Centre</span>
          </div>
          <div className="flex items-center gap-2">
            {dataSources.map((src) => (
              <div key={src.name} className="flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: src.color }} />
                <span className="text-[9px] font-medium text-muted-foreground">{src.name}</span>
                <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--status-healthy))]" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dashboard body */}
          <div className="flex flex-col gap-3 p-4">
          {/* KPI row */}
          <motion.div
            className="grid grid-cols-4 gap-2"
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
                <p className="text-[8px] text-muted-foreground">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-sm font-semibold tabular-nums">{kpi.value}</p>
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

          {/* MRR Chart + Live Feed */}
          <div className="grid h-[280px] grid-cols-5 gap-3">
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card col-span-3"
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
                      <linearGradient id="homeMrr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#homeMrr)" />
                  </AreaChart>
                </ChartContainer>
              </div>
            </motion.div>

            {/* Live Activity Feed */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card col-span-2"
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
                <AnimatePresence mode="wait">
                  {visibleItems.map((item) => (
                    <motion.div
                      key={`${item.source}-${item.event}-${item.detail}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-1.5 px-3 py-2"
                    >
                      <Badge variant="outline" className={cn('mt-0.5 shrink-0 text-[8px] font-semibold', sourceColors[item.source])}>
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

          {/* Location Occupancy + AI Risk Insights + Pipeline Snapshot */}
          <div className="grid grid-cols-3 gap-3">
            {/* Location occupancy */}
            <motion.div
              className="overflow-hidden rounded-lg border border-border/50 bg-card"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.65, duration: 0.35 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Location Occupancy</span>
              </div>
              <div className="flex flex-col gap-2 px-3 py-2.5">
                {locationData.map((loc, i) => (
                  <motion.div
                    key={loc.name}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.7 + i * 0.05, duration: 0.25 }}
                  >
                    <span className="w-20 shrink-0 truncate text-[9px] text-muted-foreground">{loc.name}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full',
                          loc.status === 'healthy' ? 'bg-[hsl(var(--status-healthy)/0.5)]' : 'bg-[hsl(var(--status-warning)/0.5)]',
                        )}
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${loc.occupancy}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[9px] tabular-nums font-medium">{loc.occupancy}%</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* AI Risk Insights */}
            <motion.div
              className="overflow-hidden rounded-lg border border-border/50 bg-card"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.7, duration: 0.35 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">AI Risk Insights</span>
                <AlertTriangle className="ml-auto h-2.5 w-2.5 text-[hsl(var(--status-warning))]" />
              </div>
              <div className="flex min-h-0 flex-col justify-center px-3 py-2.5">
                <AnimatePresence mode="wait">
                  {activeRisk && (
                    <motion.div
                      key={activeRisk.company}
                      className="flex flex-col gap-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold">{activeRisk.company}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[8px]',
                            activeRisk.level === 'danger'
                              ? 'border-[hsl(var(--status-danger)/0.3)] bg-[hsl(var(--status-danger)/0.1)] text-[hsl(var(--status-danger))]'
                              : activeRisk.level === 'warning'
                                ? 'border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]'
                                : 'border-[hsl(var(--status-healthy)/0.3)] bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))]',
                          )}
                        >
                          {activeRisk.signal}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Impact: <span className="font-medium text-foreground">{activeRisk.mrrImpact}</span>
                      </p>
                      <div className="flex items-start gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
                        <ArrowRight className="mt-0.5 h-2.5 w-2.5 shrink-0 text-primary" />
                        <p className="text-[9px] leading-snug text-foreground/80">{activeRisk.action}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Pipeline Snapshot */}
            <motion.div
              className="overflow-hidden rounded-lg border border-border/50 bg-card"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.75, duration: 0.35 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Pipeline vs Availability</span>
              </div>
              <div className="flex flex-col gap-2 px-3 py-2.5">
                {pipelineSnapshot.map((item, i) => (
                  <motion.div
                    key={item.type}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.8 + i * 0.05, duration: 0.25 }}
                  >
                    <span className="w-16 shrink-0 truncate text-[9px] text-muted-foreground">{item.type}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-[hsl(var(--chart-2)/0.5)]"
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${(item.available / 20) * 100}%` } : undefined}
                        transition={{ delay: 0.85 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${(item.pipeline / 20) * 100}%` } : undefined}
                        transition={{ delay: 0.95 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-[9px] tabular-nums font-medium">
                      {item.pipeline}/{item.available}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Deals Table */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.85, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Recent Activity</span>
              </div>
              <span className="text-[9px] text-muted-foreground">
                8 deals this week
              </span>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="px-2 py-1 text-left font-medium">Company</th>
                    <th className="px-2 py-1 text-left font-medium">Type</th>
                    <th className="px-2 py-1 text-left font-medium">Stage</th>
                    <th className="px-2 py-1 text-right font-medium">Value</th>
                    <th className="px-2 py-1 text-left font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeals.map((row, i) => (
                    <motion.tr
                      key={row.company}
                      className="border-b border-border/10 last:border-b-0"
                      initial={animate ? { opacity: 0 } : false}
                      animate={animate ? { opacity: 1 } : undefined}
                      transition={{ delay: 0.9 + i * 0.04, duration: 0.2 }}
                    >
                      <td className="px-2 py-1 font-medium">{row.company}</td>
                      <td className="px-2 py-1 text-muted-foreground">{row.type}</td>
                      <td className="px-2 py-1">
                        <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[7px] font-medium', stageStyle(row.stage))}>
                          {row.stage}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums">{row.value}</td>
                      <td className="px-2 py-1">
                        <Badge variant="outline" className={cn('text-[7px]', sourceColors[row.source])}>
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
