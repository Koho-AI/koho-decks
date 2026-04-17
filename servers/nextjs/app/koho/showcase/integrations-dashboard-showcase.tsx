'use client';

import { useRef } from 'react';
// Using plain img instead of next/image to avoid domain whitelisting for external URLs
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LineChart,
  Plug,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { cn } from '@kit/ui/utils';

import Marquee from '../magicui/marquee';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: TrendingUp, label: 'Pipeline' },
  { icon: LineChart, label: 'Forecasting' },
  { icon: Shield, label: 'Finance' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Plug, label: 'Integrations', active: true },
  { icon: Users, label: 'Clients' },
  { icon: Zap, label: 'Automation' },
  { icon: Settings, label: 'Settings' },
];

const kpis = [
  { label: 'Connected', value: '11' },
  { label: 'Records Synced', value: '47,832' },
  { label: 'Last Sync', value: '2 min ago', healthy: true },
  { label: 'Categories', value: '5' },
];

const LOGO_BASE = 'https://www.koho.ai/images/logos/integrations';

const ROW_1 = [
  { name: 'Nexudus', logo: `${LOGO_BASE}/nexudus.svg`, connected: true },
  { name: 'HubSpot', logo: `${LOGO_BASE}/hubspot.svg`, connected: true },
  { name: 'Xero', logo: `${LOGO_BASE}/xero.svg`, connected: true },
  { name: 'TwiinData', logo: `${LOGO_BASE}/twiindata.svg`, connected: true },
  { name: 'Halo PSA', logo: `${LOGO_BASE}/halo-psa.svg`, connected: true },
  { name: 'Operate', logo: `${LOGO_BASE}/essensys-operate.png`, connected: true },
];

const ROW_2 = [
  { name: 'OfficeRnD', logo: `${LOGO_BASE}/officernd.svg`, connected: true },
  { name: 'Salesforce', logo: `${LOGO_BASE}/salesforce.svg`, connected: true },
  { name: 'QuickBooks', logo: `${LOGO_BASE}/quickbooks.png`, connected: true },
  { name: 'Dynamics CRM', logo: `${LOGO_BASE}/microsoftdynamics.svg`, connected: true },
  { name: 'Layer8', logo: `${LOGO_BASE}/layer8-logo.svg`, connected: false },
];

const syncActivity = [
  { name: 'Nexudus', records: '12,450', lastSync: '2 min ago' },
  { name: 'HubSpot', records: '8,234', lastSync: '5 min ago' },
  { name: 'Salesforce', records: '6,891', lastSync: '3 min ago' },
  { name: 'Xero', records: '4,120', lastSync: '8 min ago' },
  { name: 'OfficeRnD', records: '3,560', lastSync: '4 min ago' },
];

function IntegrationChip({
  name,
  logo,
  connected,
}: {
  name: string;
  logo: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt=""
        width={18}
        height={18}
        className="shrink-0 object-contain"
      />
      <span className="whitespace-nowrap text-[10px] font-medium">
        {name}
      </span>
      <span
        className={cn(
          'ml-auto flex h-1.5 w-1.5 shrink-0 rounded-full',
          connected
            ? 'bg-[hsl(var(--status-healthy))]'
            : 'bg-muted-foreground/40',
        )}
      />
    </div>
  );
}

export function IntegrationsDashboardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5%' });
  const reduceMotion = useReducedMotion();
  const animate = inView && !reduceMotion;

  return (
    <div
      ref={ref}
      className="flex min-h-[720px] overflow-hidden rounded-md bg-background text-foreground"
    >
      {/* Sidebar */}
      <motion.div
        className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border/40 bg-muted/30 py-3 sm:flex"
        initial={animate ? { x: -48, opacity: 0 } : false}
        animate={animate ? { x: 0, opacity: 1 } : undefined}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-[10px] font-bold text-primary-foreground">
            K
          </span>
        </div>
        {navItems.map((item, i) => (
          <motion.div
            key={item.label}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              item.active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground/60',
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
          className="flex items-center justify-between border-b border-border/40 px-3 py-2 sm:px-4"
          initial={animate ? { opacity: 0, y: -8 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Plug className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Integrations</span>
            <span className="text-[10px] text-muted-foreground">
              / Connected
            </span>
          </div>
          <span className="rounded-full bg-[hsl(var(--status-healthy)/0.1)] px-2 py-0.5 text-[9px] font-medium text-[hsl(var(--status-healthy))]">
            All systems operational
          </span>
        </motion.div>

        <div className="flex flex-col gap-5 p-4 sm:p-6">
          {/* KPIs */}
          <motion.div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                className="rounded-lg border border-border/50 bg-card px-3 py-2"
                initial={animate ? { opacity: 0, scale: 0.95 } : false}
                animate={animate ? { opacity: 1, scale: 1 } : undefined}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.25 }}
              >
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold tabular-nums sm:text-base">
                    {kpi.value}
                  </p>
                  {kpi.healthy && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--status-healthy))] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--status-healthy))]" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scrolling integration rows */}
          <motion.div
            className="space-y-2"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold">
                Connected Integrations
              </span>
              <span className="text-[9px] text-muted-foreground">
                11 active
              </span>
            </div>

            <div className="space-y-1.5 overflow-hidden rounded-lg border border-border/50 bg-card p-2.5 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
              <Marquee
                pauseOnHover
                className="[--duration:22s] [--gap:0.5rem]"
              >
                {ROW_1.map((item) => (
                  <IntegrationChip key={item.name} {...item} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:26s] [--gap:0.5rem]"
              >
                {ROW_2.map((item) => (
                  <IntegrationChip key={item.name} {...item} />
                ))}
              </Marquee>
            </div>
          </motion.div>

          {/* Recent sync activity */}
          <motion.div
            className="rounded-lg border border-border/50 bg-card"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.6, duration: 0.35 }}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <span className="text-[10px] font-semibold">
                Recent Sync Activity
              </span>
              <span className="text-[9px] text-muted-foreground">
                Last 24h
              </span>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/20 text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">
                    Integration
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium">
                    Records
                  </th>
                  <th className="hidden px-3 py-1.5 text-right font-medium sm:table-cell">
                    Last Sync
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {syncActivity.map((row, i) => (
                  <motion.tr
                    key={row.name}
                    className="border-b border-border/10 last:border-b-0"
                    initial={animate ? { opacity: 0 } : false}
                    animate={animate ? { opacity: 1 } : undefined}
                    transition={{ delay: 0.7 + i * 0.05, duration: 0.2 }}
                  >
                    <td className="px-3 py-1.5 font-medium">{row.name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {row.records}
                    </td>
                    <td className="hidden px-3 py-1.5 text-right tabular-nums text-muted-foreground sm:table-cell">
                      {row.lastSync}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-healthy))]" />
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
