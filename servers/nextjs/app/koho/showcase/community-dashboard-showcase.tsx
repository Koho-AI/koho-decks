'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Heart,
  Home,
  LayoutDashboard,
  LineChart,
  Settings,
  Shield,
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
  communityKPIs,
  memberHealthDistribution,
  memberHealthTrend,
  upcomingRenewals,
} from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Users, label: 'Community', active: true },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
  { icon: Shield, label: 'Risk' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const chartConfig = {
  healthy: { label: 'Thriving', color: 'hsl(var(--chart-1))' },
  steady: { label: 'Steady', color: 'hsl(var(--chart-3))' },
  atRisk: { label: 'At Risk', color: 'hsl(var(--chart-4))' },
  critical: { label: 'Critical', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

function healthColor(score: number) {
  if (score < 40) return 'bg-[hsl(var(--status-danger))]';
  if (score < 60) return 'bg-[hsl(var(--status-warning))]';
  return 'bg-[hsl(var(--status-healthy))]';
}

const bandColors: Record<string, string> = {
  Thriving: 'bg-[hsl(var(--chart-1)/0.15)] text-[hsl(var(--chart-1))]',
  Steady: 'bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))]',
  'At Risk': 'bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]',
  Critical: 'bg-[hsl(var(--status-danger)/0.15)] text-[hsl(var(--status-danger))]',
};

export function CommunityDashboardShowcase() {
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
            className={cn('flex h-8 w-8 items-center justify-center rounded-md transition-colors', item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground/60')}
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
            <Heart className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Community</span>
            <span className="text-[10px] text-muted-foreground">/ Member Health</span>
          </div>
          <div className="flex items-center gap-1.5">
            {memberHealthDistribution.map((b) => (
              <span key={b.band} className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-medium', bandColors[b.band])}>
                {b.count} {b.band}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <motion.div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            {communityKPIs.map((kpi, i) => (
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
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold">Health Trend</span>
                </div>
                <span className="text-[9px] text-muted-foreground">6 months</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={memberHealthTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="healthy" stackId="s" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1)/0.15)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="steady" stackId="s" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3)/0.15)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="atRisk" stackId="s" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4)/0.15)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="critical" stackId="s" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/0.15)" strokeWidth={1.5} />
                  </AreaChart>
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
                <Users className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Health Distribution</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden px-3 py-2">
                {memberHealthDistribution.map((band, i) => (
                  <motion.div
                    key={band.band}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.65 + i * 0.06, duration: 0.25 }}
                  >
                    <span className="w-14 shrink-0 truncate text-[9px] text-muted-foreground">{band.band}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className={cn('absolute inset-y-0 left-0 rounded-full', bandColors[band.band]?.split(' ')[0])}
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${band.pct}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[9px] tabular-nums font-medium">{band.count}</span>
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
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Upcoming Renewals</span>
              </div>
              <span className="text-[9px] text-muted-foreground">Next 90 days</span>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/20 text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">Company</th>
                  <th className="px-3 py-1.5 text-right font-medium">MRR</th>
                  <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Renewal</th>
                  <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Health</th>
                  <th className="px-3 py-1.5 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRenewals.slice(0, 8).map((row, i) => (
                  <motion.tr key={row.company} className="border-b border-border/10 last:border-b-0" initial={animate ? { opacity: 0 } : false} animate={animate ? { opacity: 1 } : undefined} transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}>
                    <td className="px-3 py-1.5 font-medium">{row.company}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{row.mrr}</td>
                    <td className="hidden px-3 py-1.5 tabular-nums sm:table-cell">{row.renewDate}</td>
                    <td className="hidden px-3 py-1.5 sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="relative h-1.5 w-10 overflow-hidden rounded-full bg-muted/50">
                          <div className={cn('absolute inset-y-0 left-0 rounded-full', healthColor(row.health))} style={{ width: `${row.health}%` }} />
                        </div>
                        <span className="text-[9px] tabular-nums">{row.health}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-[9px] text-muted-foreground">{row.action}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
