import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-[hsl(var(--status-healthy)/0.2)] bg-[hsl(var(--status-healthy)/0.1)] text-[hsl(var(--status-healthy))] hover:bg-[hsl(var(--status-healthy)/0.15)]',
        warning:
          'border-[hsl(var(--status-warning)/0.2)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))] hover:bg-[hsl(var(--status-warning)/0.15)]',
        danger:
          'border-[hsl(var(--status-danger)/0.2)] bg-[hsl(var(--status-danger)/0.1)] text-[hsl(var(--status-danger))] hover:bg-[hsl(var(--status-danger)/0.15)]',
        info: 'border-[hsl(var(--status-info)/0.2)] bg-[hsl(var(--status-info)/0.1)] text-[hsl(var(--status-info))] hover:bg-[hsl(var(--status-info)/0.15)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
