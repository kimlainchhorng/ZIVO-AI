import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'warning';

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  Status,
  {
    variant: 'default' | 'success' | 'warning' | 'error' | 'neutral';
    dot: string;
    defaultLabel: string;
  }
> = {
  idle:    { variant: 'neutral',  dot: 'bg-slate-500',                    defaultLabel: 'Idle' },
  pending: { variant: 'warning',  dot: 'bg-amber-400 animate-pulse',      defaultLabel: 'Pending' },
  running: { variant: 'default',  dot: 'bg-indigo-400 animate-pulse',     defaultLabel: 'Running' },
  success: { variant: 'success',  dot: 'bg-emerald-400',                  defaultLabel: 'Success' },
  error:   { variant: 'error',    dot: 'bg-red-400',                      defaultLabel: 'Error' },
  warning: { variant: 'warning',  dot: 'bg-amber-400',                    defaultLabel: 'Warning' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} aria-hidden="true" />
      {label ?? config.defaultLabel}
    </Badge>
  );
}
