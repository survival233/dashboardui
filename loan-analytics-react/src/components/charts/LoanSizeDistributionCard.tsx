import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { adaptiveYAxisLayout, axisBottomSpacing, axisLabelBottom, axisLabelLeftVertical, axisTickDefault, gridLine, palette } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

const GRADE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
const BINS = [
  { label: '<5k', min: 0, max: 5_000 },
  { label: '5k-10k', min: 5_000, max: 10_000 },
  { label: '10k-15k', min: 10_000, max: 15_000 },
  { label: '15k-20k', min: 15_000, max: 20_000 },
  { label: '20k-30k', min: 20_000, max: 30_000 },
  { label: '30k+', min: 30_000, max: Number.POSITIVE_INFINITY },
] as const

export function LoanSizeDistributionCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [plotH, setPlotH] = useState(260)

  const data = useMemo(() => {
    return BINS.map((bin) => {
      const row: Record<string, number | string> = { bucket: bin.label }
      for (const g of GRADE_ORDER) row[g] = 0
      for (const l of loans) {
        if (l.amount >= bin.min && l.amount < bin.max && GRADE_ORDER.includes(l.grade as any)) {
          row[l.grade] = Number(row[l.grade] ?? 0) + 1
        }
      }
      return row
    })
  }, [loans])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const h = Math.max(160, Math.round(el.getBoundingClientRect().height || 260))
      setPlotH(h)
    }
    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const yAxis = adaptiveYAxisLayout(plotH, { minPxPerTick: 44, minWidth: 48, maxWidth: 60 })
  const bottom = axisBottomSpacing({ hasXAxisLabel: true, hasLegend: false, denseTicks: true, extraBottom: 0 })

  if (loading) {
    return <div className="flex h-full min-h-0 flex-col gap-3 p-2"><Skeleton className="h-6 w-56" /><Skeleton className="flex-1 w-full rounded-xl" /></div>
  }
  if (!loans.length) return <EmptyState title="No loan size data" description="Adjust filters to inspect loan size mix." />

  return (
    <div ref={wrapRef} className="flex min-h-0 w-full flex-1 flex-col">
      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
        <BarChart data={data} margin={{ top: 34, right: 14, left: 20, bottom: bottom.bottomMargin }}>
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="bucket"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            height={bottom.xAxisHeight}
            tickMargin={6}
            label={axisLabelBottom('Loan amount bucket')}
          />
          <YAxis
            tick={yAxis.tick}
            tickLine={false}
            axisLine={false}
            width={yAxis.width}
            tickMargin={yAxis.tickMargin}
            tickCount={yAxis.tickCount}
            interval="preserveStartEnd"
            label={axisLabelLeftVertical('Loans', yAxis.labelOffset)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(99,102,241,0.04)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const entries = (payload as any[])
                .filter((p) => p?.value)
                .sort((a, b) => Number(b.value) - Number(a.value))
              return (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="min-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)]">Bucket {String(label)}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    {entries.map((p) => (
                      <div key={String(p.dataKey)} className="flex justify-between gap-6">
                        <dt>Grade {String(p.dataKey)}</dt>
                        <dd className="font-semibold tabular-nums text-[var(--text)]">{Number(p.value).toLocaleString()}</dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              )
            }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11, top: 0 }} />
          {GRADE_ORDER.map((g, i) => (
            <Bar key={g} dataKey={g} stackId="grades" fill={palette[i] ?? '#6366F1'} radius={i === GRADE_ORDER.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

