'use client';

import { useMemo, type CSSProperties } from 'react';

// Using plain img instead of next/image for external URLs

import { motion, useReducedMotion } from 'framer-motion';

import { Card, CardContent } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

import { integrationKPIs, integrationNodes } from './showcase-data';

const CX = 160;
const CY = 160;
const R = 110;
const NODE = 48;

export function IntegrationsShowcase() {
  const reduceMotion = useReducedMotion();

  const nodes = useMemo(
    () =>
      integrationNodes.map((node, i) => {
        const angle = (i / integrationNodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = CX + R * Math.cos(angle);
        const y = CY + R * Math.sin(angle);
        return { ...node, x, y, i };
      }),
    [],
  );

  const linePaths = useMemo(
    () =>
      nodes.map((n) => ({
        d: `M ${n.x} ${n.y} L ${CX} ${CY}`,
        key: n.name,
        ox: n.x - CX,
        oy: n.y - CY,
        delay: n.i * 0.22,
        i: n.i,
      })),
    [nodes],
  );

  return (
    <div className="space-y-8">
      <div className="relative mx-auto h-[320px] w-[320px] max-w-full">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-primary/25"
          viewBox="0 0 320 320"
          aria-hidden
        >
          {linePaths.map((line, idx) => (
            <motion.path
              key={line.key}
              d={line.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { pathLength: { duration: 0.7, delay: 0.08 * idx, ease: 'easeOut' }, opacity: { duration: 0.25, delay: 0.08 * idx } }
              }
            />
          ))}
        </svg>

        {!reduceMotion ? (
          <style>{`
            @keyframes integrations-particle {
              from {
                transform: translate(calc(var(--ox) * 1px), calc(var(--oy) * 1px));
                opacity: 0.35;
              }
              to {
                transform: translate(0, 0);
                opacity: 1;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .integrations-particle {
                animation: none !important;
                transform: translate(0, 0) !important;
                opacity: 0.85 !important;
              }
            }
            .integrations-particle {
              animation: integrations-particle 2.4s linear infinite;
              animation-delay: var(--delay, 0s);
            }
          `}</style>
        ) : null}

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-0 w-0 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          {linePaths.map((line) =>
            reduceMotion ? null : (
              <span
                key={`p-${line.key}`}
                className="integrations-particle absolute left-0 top-0 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                style={
                  {
                    '--ox': line.ox,
                    '--oy': line.oy,
                    '--delay': `${line.delay}s`,
                  } as CSSProperties
                }
              />
            ),
          )}
        </div>

        <div
          className="absolute left-1/2 top-1/2 z-[2] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-md ring-2 ring-primary/30"
          aria-label="Koho"
        >
          K
        </div>

        {nodes.map((node, idx) => (
          <motion.div
            key={node.name}
            className="absolute z-[2]"
            style={{
              left: node.x - NODE / 2,
              top: node.y - NODE / 2,
              width: NODE,
              height: NODE,
            }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 1, scale: 1, y: [0, -3, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    opacity: { delay: 0.06 * idx, duration: 0.35, ease: 'easeOut' },
                    scale: { delay: 0.06 * idx, duration: 0.35, ease: 'easeOut' },
                    y: {
                      delay: 0.4 + idx * 0.08,
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
            }
          >
            <div
              className={cn(
                'flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-border bg-card shadow-sm',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={node.logo}
                alt=""
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { delay: 0.45, duration: 0.45, ease: 'easeOut' }
        }
      >
        {integrationKPIs.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="space-y-1 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold tabular-nums">{kpi.value}</p>
                {kpi.label === 'Last Sync' ? (
                  <span
                    className="relative flex h-2 w-2 shrink-0"
                    aria-hidden
                  >
                    <span
                      className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--status-healthy))] opacity-60 animate-ping"
                    />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--status-healthy))]" />
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
