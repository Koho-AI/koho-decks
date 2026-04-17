'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LineChart,
  MapPin,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';

import { Badge } from '@kit/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { cn } from '@kit/ui/utils';

import { locationStatuses, occupancyVsUtilisation, operationsKPIs } from './showcase-data';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Operations', active: true },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Users, label: 'Clients' },
  { icon: Shield, label: 'Risk' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const chartConfig = {
  utilisation: { label: 'Utilisation', color: 'hsl(var(--chart-2))' },
  spread: { label: 'Occupancy headroom', color: 'hsl(var(--chart-6))' },
} satisfies ChartConfig;

const locationDetails = [
  { name: 'Kings Cross', desks: 180, occupied: 164, utilisation: 78, occupancy: 91 },
  { name: 'Shoreditch', desks: 140, occupied: 123, utilisation: 74, occupancy: 88 },
  { name: 'Manchester', desks: 120, occupied: 95, utilisation: 68, occupancy: 79 },
  { name: 'Bristol', desks: 90, occupied: 76, utilisation: 71, occupancy: 84 },
  { name: 'Edinburgh', desks: 100, occupied: 82, utilisation: 72, occupancy: 82 },
  { name: 'Birmingham', desks: 110, occupied: 84, utilisation: 65, occupancy: 76 },
  { name: 'Leeds', desks: 85, occupied: 68, utilisation: 70, occupancy: 80 },
  { name: 'Cambridge', desks: 70, occupied: 60, utilisation: 76, occupancy: 86 },
];

export function OperationsDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  const chartData = useMemo(
    () => occupancyVsUtilisation.map((d) => ({
      month: d.month,
      utilisation: d.utilisation,
      spread: Number((d.occupancy - d.utilisation).toFixed(2)),
    })),
    [],
  );

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
            <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Operations</span>
            <span className="text-[10px] text-muted-foreground">/ Portfolio Health</span>
          </div>
          <div className="flex items-center gap-1.5">
            {locationStatuses.map((loc) => (
              <span key={loc.name} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className={cn('h-1.5 w-1.5 rounded-full', loc.level === 'healthy' ? 'bg-[hsl(var(--status-healthy))]' : 'bg-[hsl(var(--status-warning))]')} />
                {loc.name}
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
            {operationsKPIs.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                className={cn('rounded-lg border bg-card px-3 py-2', kpi.variant === 'warning' ? 'border-[hsl(var(--status-warning)/0.3)]' : 'border-border/50')}
                initial={animate ? { opacity: 0, scale: 0.95 } : false}
                animate={animate ? { opacity: 1, scale: 1 } : undefined}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.25 }}
              >
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-sm font-semibold tabular-nums sm:text-base">{kpi.value}</p>
                  <span className={cn('text-[9px] font-medium tabular-nums', kpi.trend.sentiment === 'positive' ? 'text-[hsl(var(--status-healthy))]' : 'text-[hsl(var(--status-danger))]')}>
                    {kpi.trend.direction === 'up' ? '+' : ''}{kpi.trend.delta}{kpi.trend.isPercentage ? '%' : ''}
                  </span>
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
                  <span className="text-[10px] font-semibold">Occupancy & Utilisation</span>
                </div>
                <span className="text-[9px] text-muted-foreground">12 months</span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[55, 95]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} width={32} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="utilisation" stackId="s" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="hsl(var(--chart-3)/0.14)" />
                    <Area type="monotone" dataKey="spread" stackId="s" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="hsl(var(--chart-6)/0.22)" />
                  </ComposedChart>
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
                <MapPin className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold">Location Summary</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden px-3 py-2">
                {locationDetails.map((loc, i) => (
                  <motion.div
                    key={loc.name}
                    className="flex items-center gap-2"
                    initial={animate ? { opacity: 0, x: 8 } : false}
                    animate={animate ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.65 + i * 0.06, duration: 0.25 }}
                  >
                    <span className="w-20 shrink-0 truncate text-[9px] text-muted-foreground">{loc.name}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className={cn('absolute inset-y-0 left-0 rounded-full', loc.occupancy >= 85 ? 'bg-[hsl(var(--status-healthy)/0.5)]' : 'bg-[hsl(var(--status-warning)/0.5)]')}
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${loc.occupancy}%` } : undefined}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[9px] tabular-nums font-medium">{loc.occupancy}%</span>
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
                <span className="text-[10px] font-semibold">Location Detail</span>
              </div>
              <span className="text-[9px] text-muted-foreground">8 locations</span>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/20 text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">Location</th>
                  <th className="px-3 py-1.5 text-right font-medium">Desks</th>
                  <th className="px-3 py-1.5 text-right font-medium">Occupied</th>
                  <th className="hidden px-3 py-1.5 text-right font-medium sm:table-cell">Utilisation</th>
                  <th className="px-3 py-1.5 text-right font-medium">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {locationDetails.map((row, i) => (
                  <motion.tr key={row.name} className="border-b border-border/10 last:border-b-0" initial={animate ? { opacity: 0 } : false} animate={animate ? { opacity: 1 } : undefined} transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}>
                    <td className="px-3 py-1.5 font-medium">{row.name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{row.desks}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{row.occupied}</td>
                    <td className="hidden px-3 py-1.5 text-right tabular-nums sm:table-cell">{row.utilisation}%</td>
                    <td className="px-3 py-1.5 text-right">
                      <span className={cn('tabular-nums font-medium', row.occupancy >= 85 ? 'text-[hsl(var(--status-healthy))]' : 'text-[hsl(var(--status-warning))]')}>{row.occupancy}%</span>
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
