'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LineChart,
  PieChart,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import {
  arAgeing,
  financeKPIs,
  monthlyRevenue,
  revenueByType,
} from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
  { icon: Shield, label: 'Finance', active: true },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const chartConfig = {
  recognised: { label: 'Recognised', color: 'hsl(var(--chart-1))' },
  deferred: { label: 'Deferred', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

export function FinanceDashboardShowcase() {
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
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Finance</span>
            <span className="text-[10px] text-muted-foreground">/ Revenue Overview</span>
          </div>
          <span className="rounded-full bg-[hsl(var(--status-healthy)/0.1)] px-2 py-0.5 text-[9px] font-medium text-[hsl(var(--status-healthy))]">
            96.8% collection rate
          </span>
        </motion.div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <motion.div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            {financeKPIs.map((kpi, i) => (
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
                  <span className="text-[10px] font-semibold">Revenue Recognition</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Recognised vs Deferred</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="finRecFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="recognised" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#finRecFill)" />
                    <Area type="monotone" dataKey="deferred" stroke="hsl(var(--chart-3))" strokeWidth={2} fill="hsl(var(--chart-3)/0.08)" strokeDasharray="4 2" />
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
                <PieChart className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Revenue by Type</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden px-3 py-2">
                {revenueByType.map((item, i) => (
                  <motion.div
                    key={item.type}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.65 + i * 0.06, duration: 0.25 }}
                  >
                    <span className="w-20 shrink-0 truncate text-[9px] text-muted-foreground">{item.type}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary/50"
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${item.pct}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[9px] tabular-nums font-medium">£{(item.amount / 1000).toFixed(0)}k</span>
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
                <BarChart3 className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Accounts Receivable Ageing</span>
              </div>
              <span className="text-[9px] text-muted-foreground">Total: £266k</span>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/20 text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">Ageing Band</th>
                  <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                  <th className="px-3 py-1.5 text-right font-medium">% of Total</th>
                  <th className="hidden px-3 py-1.5 text-left font-medium sm:table-cell">Distribution</th>
                </tr>
              </thead>
              <tbody>
                {arAgeing.map((row, i) => (
                  <motion.tr key={row.band} className="border-b border-border/10 last:border-b-0" initial={animate ? { opacity: 0 } : false} animate={animate ? { opacity: 1 } : undefined} transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}>
                    <td className="px-3 py-1.5 font-medium">{row.band}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">£{(row.amount / 1000).toFixed(0)}k</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{row.pct}%</td>
                    <td className="hidden px-3 py-1.5 sm:table-cell">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
                        <div
                          className={cn('absolute inset-y-0 left-0 rounded-full', row.band === 'Current' ? 'bg-[hsl(var(--status-healthy)/0.5)]' : row.band === '60+ days' ? 'bg-[hsl(var(--status-danger)/0.5)]' : 'bg-[hsl(var(--status-warning)/0.5)]')}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </td>
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
