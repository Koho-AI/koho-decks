'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

import { beforeAfter } from './showcase-data';

function MetricColumn({
  value,
  label,
  valueClassName,
}: {
  value: string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className={cn('font-semibold tabular-nums', valueClassName)}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function CustomerSuccessShowcase() {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.45;
  const stagger = reduceMotion ? 0 : 0.12;

  return (
    <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:justify-center md:gap-4">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration, ease: 'easeOut' }}
        className="min-w-0 flex-1 md:max-w-md"
      >
        <Card
          className={cn(
            'border-muted/80 bg-muted/30 shadow-sm',
            'grayscale-[0.35] contrast-[0.95]',
          )}
        >
          <CardContent className="space-y-4 p-4 pt-5">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              Before Koho
            </Badge>
            <div className="grid grid-cols-3 gap-2">
              {beforeAfter.before.map((item) => (
                <MetricColumn
                  key={item.label}
                  value={item.value}
                  label={item.label}
                  valueClassName="text-lg text-muted-foreground md:text-xl"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="flex shrink-0 justify-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration, delay: stagger, ease: 'easeOut' }}
        aria-hidden
      >
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.55, 1, 0.55], x: [0, 3, 0] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary"
        >
          <ArrowRight className="h-5 w-5" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration, delay: stagger * 2, ease: 'easeOut' }}
        className="min-w-0 flex-1 md:max-w-md"
      >
        <Card
          className={cn(
            'border-primary/10 shadow-md ring-1 ring-primary/20',
            'bg-card',
          )}
        >
          <CardContent className="space-y-4 p-4 pt-5">
            <Badge variant="success" className="text-[10px] uppercase tracking-wider">
              With Koho
            </Badge>
            <div className="grid grid-cols-3 gap-2">
              {beforeAfter.after.map((item) => (
                <MetricColumn
                  key={item.label}
                  value={item.value}
                  label={item.label}
                  valueClassName="text-2xl text-primary md:text-3xl"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
