// components/ui/Badge.tsx — CVA-based Badge component
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/30',
        neutral: 'bg-white/5 text-slate-400 border border-white/10',
        outline: 'border border-current bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Legacy type alias for backwards compatibility
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

