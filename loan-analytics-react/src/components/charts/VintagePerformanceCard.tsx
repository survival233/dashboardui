import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { axisLabelBottom, axisLabelLeftVertical, axisLabelRightVertical, axisTickDefault, gridLine, primary, primarySoft } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type Row = {
  vintage: string
  expectedReturnPct: number
  defaultRatePct: number
  loanCount: number
}

export function VintagePerformanceCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()

  const data = useMemo<Row[]>(() => {
    const byVintage = new Map<string, { n: number; defaults: number; retSum: number }>()
    for (const l of loans) {
      const y = l.issuedAt.getFullYear()
      const q = Math.floor(l.issuedAt.getMonth() / 3) + 1
      const key = `${y}-Q${q}`
      const cur = byVintage.get(key) ?? { n: 0, defaults: 0, retSum: 0 }
      cur.n += 1
      cur.retSum += l.expectedReturn * 100
      if (l.earlyDefault) cur.defaults += 1
      byVintage.set(key, cur)
    }
    return [...byVintage.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([vintage, d]) => ({
        vintage,
        expectedReturnPct: d.n ? d.retSum / d.n : 0,
        defaultRatePct: d.n ? (d.defaults / d.n) * 100 : 0,
        loanCount: d.n,
      }))
      .slice(-10)
  }, [loans])

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 p-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  if (!data.length) {
    return <EmptyState title="No vintage data" description="Adjust filters to compare recent vintages." />
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
        <LineChart data={data} margin={{ top: 10, right: 24, left: 24, bottom: 22 }}>
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="vintage"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
            height={24}
            tickMargin={6}
            label={axisLabelBottom('Issue quarter')}
          />
          <YAxis
            yAxisId="left"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            width={50}
            tickMargin={8}
            tickCount={5}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            label={axisLabelLeftVertical('Expected return %', 8)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            width={50}
            tickMargin={8}
            tickCount={5}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            label={axisLabelRightVertical('Default rate %', 8)}
          />
          <Tooltip
            cursor={{ strokeDasharray: '4 4', stroke: '#CBD5E1' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0]?.payload as Row | undefined
              if (!row) return null
              return (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="min-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)]">{row.vintage}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6"><dt>Expected return</dt><dd className="font-semibold tabular-nums">{row.expectedReturnPct.toFixed(2)}%</dd></div>
                    <div className="flex justify-between gap-6"><dt>Default rate</dt><dd className="font-semibold tabular-nums">{row.defaultRatePct.toFixed(2)}%</dd></div>
                    <div className="flex justify-between gap-6"><dt>Loans</dt><dd className="font-semibold tabular-nums">{row.loanCount.toLocaleString()}</dd></div>
                  </dl>
                </motion.div>
              )
            }}
          />
          <Line yAxisId="left" type="monotone" dataKey="expectedReturnPct" stroke={primary} strokeWidth={2.5} dot={{ r: 3, fill: primary }} />
          <Line yAxisId="right" type="monotone" dataKey="defaultRatePct" stroke={primarySoft} strokeWidth={2.5} dot={{ r: 3, fill: primarySoft }} strokeDasharray="6 6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

