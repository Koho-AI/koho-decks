'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LineChart,
  Settings,
  Shield,
  Target,
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

import { leadSourceData, salesCycleData } from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Target, label: 'Sales', active: true },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const salesDashKPIs = [
  { label: 'Active Deals', value: '27', delta: '+4' },
  { label: 'Win Rate', value: '42%', delta: '+5.8%' },
  { label: 'Avg. Close', value: '34 days', delta: '-12d' },
  { label: 'Pipeline Value', value: '£142k', delta: '+12%' },
];

const cycleConfig = {
  avgDays: { label: 'Avg. days', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const leadConfig = {
  won: { label: 'Won', color: 'hsl(var(--chart-5))' },
  active: { label: 'Active', color: 'hsl(var(--chart-3))' },
  lost: { label: 'Lost', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const dealRows = [
  { company: 'Globex Inc', type: '6 desks', source: 'Website', stage: 'Proposal', value: '£3,100/mo', days: 18 },
  { company: 'Acme Corp', type: '12 desks', source: 'Referral', stage: 'Viewing', value: '£4,800/mo', days: 8 },
  { company: 'Pied Piper', type: 'Hot Desk', source: 'Direct', stage: 'Negotiation', value: '£350/mo', days: 32 },
  { company: 'Initech', type: '8 desks', source: 'Broker', stage: 'Lead', value: '£3,200/mo', days: 4 },
  { company: 'Hooli', type: '4 desks', source: 'Website', stage: 'Proposal', value: '£1,800/mo', days: 22 },
  { company: 'Stark Industries', type: '10 desks', source: 'Referral', stage: 'Viewing', value: '£5,200/mo', days: 12 },
  { company: 'Wayne Enterprises', type: '3 desks', source: 'Broker', stage: 'Negotiation', value: '£1,400/mo', days: 28 },
  { company: 'Umbrella Corp', type: '16 desks', source: 'Website', stage: 'Proposal', value: '£7,600/mo', days: 15 },
];

export function SalesDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  return (
    <div ref={ref} className="flex overflow-hidden rounded-md bg-background text-foreground">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <motion.div
          className="flex items-center justify-between border-b border-border/40 px-3 py-2 sm:px-4"
          initial={animate ? { opacity: 0, y: -8 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Sales</span>
            <span className="text-[10px] text-muted-foreground">/ Revenue Intelligence</span>
          </div>
          <span className="rounded-full bg-[hsl(var(--status-healthy)/0.1)] px-2 py-0.5 text-[9px] font-medium text-[hsl(var(--status-healthy))]">
            12 hot leads
          </span>
        </motion.div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <motion.div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            {salesDashKPIs.map((kpi, i) => (
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
                  <span className="text-[9px] font-medium tabular-nums text-[hsl(var(--status-healthy))]">{kpi.delta}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid h-[280px] grid-cols-1 gap-3 sm:h-[360px] sm:grid-cols-5">
            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-3"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">Lead Source Performance</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Won · Active · Lost</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <ChartContainer config={leadConfig} className="h-full w-full">
                  <BarChart data={leadSourceData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                    <XAxis dataKey="source" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={24} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="won" stackId="a" fill="var(--color-won)" radius={[0, 0, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="active" stackId="a" fill="var(--color-active)" radius={[0, 0, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="lost" stackId="a" fill="var(--color-lost)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ChartContainer>
              </div>
            </motion.div>

            <motion.div
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:col-span-2"
              initial={animate ? { opacity: 0, y: 12 } : false}
              animate={animate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
                <TrendingUp className="h-3 w-3 text-primary" />
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
                    <span className="w-14 shrink-0 truncate text-[9px] text-muted-foreground">{item.unitType}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${Math.min((item.avgDays / 62) * 100, 100)}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[9px] tabular-nums font-medium">{item.avgDays}d</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.7, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Active Pipeline</span>
              </div>
              <span className="text-[9px] text-muted-foreground">8 of 27 deals</span>
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
                  </tr>
                </thead>
                <tbody>
                  {dealRows.map((row, i) => (
                    <motion.tr key={row.company} className="border-b border-border/10 last:border-b-0" initial={animate ? { opacity: 0 } : false} animate={animate ? { opacity: 1 } : undefined} transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}>
                      <td className="px-3 py-1.5 font-medium">{row.company}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.type}</td>
                      <td className="hidden px-3 py-1.5 sm:table-cell"><Badge variant="outline" className="text-[8px]">{row.stage}</Badge></td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{row.value}</td>
                      <td className="hidden px-3 py-1.5 text-right tabular-nums sm:table-cell">{row.days}</td>
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
