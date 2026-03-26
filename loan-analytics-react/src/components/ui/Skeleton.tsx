import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[var(--surface-muted)]',
        className
      )}
      aria-hidden
    />
  )
}
