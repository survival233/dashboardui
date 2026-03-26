import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { useDashboardStore } from '../../store/dashboardStore'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type SortKey = 'issuedAt' | 'amount' | 'rate' | 'state' | 'grade' | 'status'

const COLS: [SortKey, string][] = [
  ['issuedAt', 'Issued'],
  ['amount', 'Amount'],
  ['rate', 'APR'],
  ['state', 'State'],
  ['grade', 'Grade'],
  ['status', 'Status'],
]

export function LoanTable({ loading }: { loading: boolean }) {
  const rows = useFilteredLoans()
  const openDrill = useDashboardStore((s) => s.openDrill)
  const [sortKey, setSortKey] = useState<SortKey>('issuedAt')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (r) =>
        r.state.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.grade.toLowerCase().includes(q) ||
        r.loanStatus.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    )
  }, [rows, search])

  const sorted = useMemo(() => {
    const d = [...filtered]
    d.sort((a, b) => {
      const mul = dir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'issuedAt': return (a.issuedAt.getTime() - b.issuedAt.getTime()) * mul
        case 'amount': return (a.amount - b.amount) * mul
        case 'rate': return (a.rate - b.rate) * mul
        case 'state': return a.state.localeCompare(b.state) * mul
        case 'grade': return a.grade.localeCompare(b.grade) * mul
        case 'status': return a.loanStatus.localeCompare(b.loanStatus) * mul
      }
    })
    return d
  }, [filtered, sortKey, dir])

  const toggle = (k: SortKey) => {
    if (sortKey === k) setDir(dir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setDir('desc') }
  }

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '0.5rem 0.7rem 0' }}>
        <input
          placeholder="Search by state, purpose, grade, status, or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[0.8rem] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No loans match"
          description={search ? 'Try a different search query.' : 'No rows satisfy the current filters.'}
        />
      ) : (
        <div className="table-wrap" style={{ marginTop: '0.4rem' }}>
          <table>
            <thead>
              <tr>
                {COLS.map(([k, label]) => (
                  <th key={k}>
                    <button type="button" onClick={() => toggle(k)}>
                      {label} {sortKey === k ? (dir === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 200).map((r) => (
                <tr key={r.id} onClick={() => openDrill(r)}>
                  <td>{format(r.issuedAt, 'MMM d, yyyy')}</td>
                  <td className="font-medium tabular-nums">${r.amount.toLocaleString()}</td>
                  <td className="tabular-nums">{r.rate.toFixed(2)}%</td>
                  <td>{r.state}</td>
                  <td>{r.grade}</td>
                  <td>{r.loanStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length > 200 && (
            <p style={{ padding: '0.5rem 0.7rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing 200 of {sorted.length.toLocaleString()} rows
            </p>
          )}
        </div>
      )}
    </div>
  )
}
