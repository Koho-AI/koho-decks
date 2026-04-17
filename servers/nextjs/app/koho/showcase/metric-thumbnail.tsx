'use client';

import { useRef } from 'react';

import { motion, useInView, useReducedMotion } from 'framer-motion';

import { Card, CardContent } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

import { caseStudyThumbnails } from './showcase-data';

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const denom = Math.max(data.length - 1, 1);

  const points = data
    .map(
      (v, i) =>
        `${(i / denom) * width},${height - ((v - min) / range) * height}`,
    )
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full', className)}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetricThumbnail({ index }: { index: number }) {
  const data = caseStudyThumbnails[index];
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-32px' });
  const reduceMotion = useReducedMotion();

  if (!data) return null;

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : reduceMotion ? {} : { opacity: 0, y: 8 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
    >
      <Card className="aspect-[4/3] overflow-hidden transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/15">
        <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {data.company}
            </p>
            <motion.p
              className="mt-2 text-2xl font-bold text-primary md:text-3xl"
              whileHover={
                reduceMotion
                  ? undefined
                  : { scale: [1, 1.04, 1], transition: { duration: 0.45 } }
              }
            >
              {data.metric}
            </motion.p>
            <p className="mt-1 text-sm text-muted-foreground">{data.label}</p>
          </div>
          <Sparkline data={data.sparkline} className="mt-auto max-h-8" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MetricThumbnailGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {caseStudyThumbnails.map((_, i) => (
        <MetricThumbnail key={i} index={i} />
      ))}
    </div>
  );
}
