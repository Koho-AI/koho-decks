'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Home,
  LayoutDashboard,
  LineChart,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';

import { Badge } from '@kit/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import { pipelineDetailed, pipelineSummaries, salesCycleData } from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: TrendingUp, label: 'Pipeline', active: true },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const chartConfig = {
  available: { label: 'Available', color: 'hsl(var(--chart-2))' },
  opportunities: { label: 'Opportunities', color: 'hsl(var(--chart-1))' },
  leads: { label: 'Leads', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

const timeframes = ['thisMonth', 'oneToThreeMonths', 'threeToSixMonths'] as const;
const timeframeLabels: Record<(typeof timeframes)[number], string> = {
  thisMonth: 'This Month',
  oneToThreeMonths: '1–3 Months',
  threeToSixMonths: '3–6 Months',
};

const pipelineKPIs = [
  { label: 'Active Deals', value: '27', delta: '+4', sentiment: 'positive' as const },
  { label: 'Pipeline Value', value: '£142k', delta: '+12%', sentiment: 'positive' as const },
  { label: 'Win Rate', value: '42%', delta: '+5.8%', sentiment: 'positive' as const },
  { label: 'Avg. Close', value: '34 days', delta: '-12d', sentiment: 'positive' as const },
];

const dealRows = [
  { company: 'Globex Inc', type: '6 desks', stage: 'Proposal', value: '£3,100/mo', days: 18, match: 'Matched' },
  { company: 'Acme Corp', type: '12 desks', stage: 'Viewing', value: '£4,800/mo', days: 8, match: 'Matched' },
  { company: 'Pied Piper', type: 'Hot Desk', stage: 'Negotiation', value: '£350/mo', days: 32, match: 'Matched' },
  { company: 'Initech', type: '8 desks', stage: 'Lead', value: '£3,200/mo', days: 4, match: 'Pending' },
  { company: 'Hooli', type: '4 desks', stage: 'Proposal', value: '£1,800/mo', days: 22, match: 'Matched' },
  { company: 'Stark Industries', type: '10 desks', stage: 'Viewing', value: '£5,200/mo', days: 12, match: 'Pending' },
  { company: 'Wayne Enterprises', type: '3 desks', stage: 'Negotiation', value: '£1,400/mo', days: 28, match: 'Matched' },
  { company: 'Umbrella Corp', type: '16 desks', stage: 'Proposal', value: '£7,600/mo', days: 15, match: 'Pending' },
];

export function PipelineDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const [activeTab, setActiveTab] = useState<(typeof timeframes)[number]>('thisMonth');

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const idx = timeframes.indexOf(prev);
        return timeframes[(idx + 1) % timeframes.length]!;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [inView, reduceMotion]);

  const data = pipelineDetailed[activeTab];
  const summary = pipelineSummaries[activeTab];

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
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Pipeline</span>
            <span className="text-[10px] text-muted-foreground">/ Availability Matching</span>
          </div>
          <div className="flex items-center gap-1.5">
            {timeframes.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setActiveTab(tf)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[9px] font-medium transition-colors',
                  activeTab === tf
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {timeframeLabels[tf]}
              </button>
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
            {pipelineKPIs.map((kpi, i) => (
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

          {/* Chart + Deal velocity row */}
          <div className="grid h-[280px] grid-cols-1 gap-3 sm:h-[360px] sm:grid-cols-5">
            {/* Pipeline vs Availability chart */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-3"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">Pipeline vs Availability</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeTab}
                    className="text-[9px] tabular-nums text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {summary.units} units · {summary.deals} deals · {summary.leads} leads
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    className="h-full w-full"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                        <XAxis
                          dataKey="label"
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
                        <Bar dataKey="available" fill="var(--color-available)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="opportunities" fill="var(--color-opportunities)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="leads" fill="var(--color-leads)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ChartContainer>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Deal velocity */}
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <Clock className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Deal Velocity</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden px-3 py-2">
                {salesCycleData.slice(0, 5).map((item, i) => (
                  <motion.div
                    key={item.unitType}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.65 + i * 0.06, duration: 0.25 }}
                  >
                    <span className="w-14 shrink-0 truncate text-[9px] text-muted-foreground">
                      {item.unitType}
                    </span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${Math.min((item.avgDays / 62) * 100, 100)}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[9px] tabular-nums font-medium">
                      {item.avgDays}d
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Active deals table */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.7, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Active Deals</span>
              </div>
              <span className="text-[9px] text-muted-foreground">
                Showing <span className="font-medium text-foreground">8</span> of <span className="font-medium text-foreground">27</span>
              </span>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="px-3 py-1.5 text-left font-medium">Company</th>
                    <th className="px-3 py-1.5 text-left font-medium">Type</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Stage</th>
                    <th className="px-3 py-1.5 text-right font-medium">Value</th>
                    <th className="hidden px-3 py-1.5 text-right font-medium sm:table-cell">Days</th>
                    <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {dealRows.map((row, i) => (
                    <motion.tr
                      key={row.company}
                      className="border-b border-border/10 last:border-b-0"
                      initial={animate ? { opacity: 0 } : false}
                      animate={animate ? { opacity: 1 } : undefined}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}
                    >
                      <td className="px-3 py-1.5 font-medium">{row.company}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.type}</td>
                      <td className="hidden px-3 py-1.5 sm:table-cell">
                        <Badge variant="outline" className="text-[8px]">{row.stage}</Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{row.value}</td>
                      <td className="hidden px-3 py-1.5 text-right tabular-nums sm:table-cell">{row.days}</td>
                      <td className="hidden px-3 py-1.5 sm:table-cell">
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-[8px] font-medium',
                            row.match === 'Matched'
                              ? 'text-[hsl(var(--status-healthy))]'
                              : 'text-[hsl(var(--status-warning))]',
                          )}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {row.match}
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
