import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { useDashboardStore } from '../../store/dashboardStore'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.72rem] text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-0.5 text-[0.82rem] font-medium text-[var(--text)]">{value}</dd>
    </div>
  )
}

export function DrillPanel() {
  const loan = useDashboardStore((s) => s.drillLoan)
  const closeDrill = useDashboardStore((s) => s.closeDrill)

  return (
    <AnimatePresence>
      {loan && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            aria-label="Close details"
            onClick={closeDrill}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drill-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--card)] pt-[env(safe-area-inset-top,0px)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Loan detail</p>
                <h2 id="drill-title" className="mt-1 text-lg font-bold tracking-tight">{loan.id}</h2>
              </div>
              <button
                type="button"
                onClick={closeDrill}
                className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="Issued" value={format(loan.issuedAt, 'MMM d, yyyy')} />
                <Field label="Amount" value={`$${loan.amount.toLocaleString()}`} />
                <Field label="APR" value={`${loan.rate.toFixed(2)}%`} />
                <Field label="Installment" value={`$${loan.installment.toFixed(2)}`} />
                <Field label="State" value={loan.state} />
                <Field label="Purpose" value={loan.purpose} />
                <Field label="Grade / Sub" value={`${loan.grade} — ${loan.subGrade}`} />
                <Field label="Status" value={loan.loanStatus} />
                <Field label="FICO range" value={`${loan.ficoLow}–${loan.ficoHigh}`} />
                <Field label="Annual income" value={`$${loan.annualIncome.toLocaleString()}`} />
                <Field label="DTI" value={`${loan.dti.toFixed(1)}%`} />
                <Field label="Early default" value={loan.earlyDefault ? 'Yes' : 'No'} />
                <div className="col-span-2">
                  <dt className="text-[0.72rem] text-[var(--text-muted)]">Expected return</dt>
                  <dd className="mt-0.5 text-[0.82rem] font-semibold tabular-nums text-[var(--text)]">
                    {(loan.expectedReturn * 100).toFixed(2)}%
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-[var(--border)] px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={closeDrill}
                className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-[0.82rem] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99]"
              >
                Done
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
