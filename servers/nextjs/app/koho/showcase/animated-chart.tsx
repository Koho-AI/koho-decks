'use client';

import { useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@kit/ui/utils';

interface AnimatedChartProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}

export function AnimatedChart({
  children,
  className,
  duration = 1.5,
  delay = 0,
}: AnimatedChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();

  const shouldAnimate = isInView && !shouldReduceMotion;

  return (
    <div
      ref={ref}
      className={cn(
        'transition-opacity',
        shouldAnimate ? 'animate-in fade-in' : !isInView ? 'opacity-0' : '',
        className,
      )}
      style={{
        ['--chart-draw-duration' as string]: `${duration}s`,
        ['--chart-draw-delay' as string]: `${delay}s`,
      }}
    >
      <style>{`
        @keyframes chartLineDraw {
          from { stroke-dashoffset: var(--path-length, 1000); }
          to { stroke-dashoffset: 0; }
        }
        .chart-line-animated .recharts-line-curve {
          stroke-dasharray: var(--path-length, 1000);
          stroke-dashoffset: var(--path-length, 1000);
          animation: chartLineDraw var(--chart-draw-duration, 1.5s) ease-out var(--chart-draw-delay, 0s) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .chart-line-animated .recharts-line-curve {
            stroke-dasharray: none;
            stroke-dashoffset: 0;
            animation: none;
          }
        }
      `}</style>
      <div className={shouldAnimate ? 'chart-line-animated' : ''}>
        {children}
      </div>
    </div>
  );
}
