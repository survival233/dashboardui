import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { formatCurrency } from '../../lib/format'
import { axisLabelBottom, axisLabelLeftVertical, axisTickDefault, gridLine, primary, primarySoft } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type Row = { purpose: string; requested: number; funded: number; gap: number }
const MAX_PURPOSES = 8

export function FundingGapCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()
  const data = useMemo<Row[]>(() => {
    const map = new Map<string, { requested: number; funded: number }>()
    for (const l of loans) {
      const key = l.purpose
      const cur = map.get(key) ?? { requested: 0, funded: 0 }
      cur.requested += l.amount
      // If funded_amount is missing/invalid, treat it as 0 to keep the gap visible.
      cur.funded += Math.max(l.fundedAmount ?? 0, 0)
      map.set(key, cur)
    }
    return [...map.entries()]
      .map(([purpose, cur]) => ({
        purpose,
        requested: cur.requested,
        funded: cur.funded,
        gap: Math.max(cur.requested - cur.funded, 0),
      }))
      .sort((a, b) => b.requested - a.requested)
      .slice(0, MAX_PURPOSES)
  }, [loans])

  if (loading) return <div className="flex h-full min-h-0 flex-col gap-3 p-2"><Skeleton className="h-6 w-56" /><Skeleton className="flex-1 w-full rounded-xl" /></div>
  if (!loans.length) return <EmptyState title="No funding gap data" description="Adjust filters to inspect requested vs funded." />

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
        <ComposedChart data={data} margin={{ top: 10, right: 14, left: 10, bottom: 18 }}>
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="purpose"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            interval={0}
            height={46}
            tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
            label={axisLabelBottom('Purpose')}
          />
          <YAxis
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            width={62}
            tickFormatter={(v: number) => `$${Math.round(v / 1_000_000)}M`}
            label={axisLabelLeftVertical('Amount ($)')}
          />
          <Tooltip
            cursor={{ fill: 'rgba(99,102,241,0.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0]?.payload as Row | undefined
              if (!row) return null
              return (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="min-w-[240px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)] capitalize">{row.purpose}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6"><dt>Requested</dt><dd className="font-semibold tabular-nums text-[var(--text)]">{formatCurrency(row.requested)}</dd></div>
                    <div className="flex justify-between gap-6"><dt>Funded</dt><dd className="font-semibold tabular-nums text-[var(--text)]">{formatCurrency(row.funded)}</dd></div>
                    <div className="flex justify-between gap-6"><dt>Gap</dt><dd className="font-semibold tabular-nums" style={{ color: row.gap > 0 ? 'var(--negative)' : 'var(--positive)' }}>{formatCurrency(row.gap)}</dd></div>
                  </dl>
                </motion.div>
              )
            }}
          />
          <Bar dataKey="requested" name="Requested" fill={primarySoft} radius={[6, 6, 0, 0]} maxBarSize={34} barSize={34} />
          <Bar dataKey="funded" name="Funded" fill={primary} radius={[6, 6, 0, 0]} maxBarSize={34} barSize={34} />
          <Line
            type="monotone"
            dataKey="gap"
            name="Gap"
            stroke="#EF4444"
            strokeWidth={2.5}
            strokeDasharray="6 6"
            dot={{ r: 3, fill: '#EF4444' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

