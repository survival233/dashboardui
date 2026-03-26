import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v3m0 12v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M3 12h3m12 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-[15px] font-semibold tracking-tight text-[var(--text)]">
          {title}
        </p>
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      </div>
      {action}
    </motion.div>
  )
}
