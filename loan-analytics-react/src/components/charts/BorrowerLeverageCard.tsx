import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { adaptiveYAxisLayout, axisLabelBottom, axisLabelLeftVertical, axisLabelRightVertical, axisTickDefault, gridLine, primary, primarySoft } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type Row = { band: string; borrowers: number; avgLeveragePct: number }

const BANDS: Array<{ label: string; min: number; max: number }> = [
  { label: '<5%', min: 0, max: 5 },
  { label: '5-10%', min: 5, max: 10 },
  { label: '10-15%', min: 10, max: 15 },
  { label: '15-20%', min: 15, max: 20 },
  { label: '20-30%', min: 20, max: 30 },
  { label: '30%+', min: 30, max: Number.POSITIVE_INFINITY },
]

export function BorrowerLeverageCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [plotH, setPlotH] = useState(260)

  const data = useMemo<Row[]>(() => {
    const rows = BANDS.map((b) => ({ band: b.label, borrowers: 0, leverageSum: 0 }))
    for (const l of loans) {
      const monthlyIncome = l.annualIncome > 0 ? l.annualIncome / 12 : 0
      const leveragePct = monthlyIncome > 0 ? (l.installment / monthlyIncome) * 100 : 0
      const idx = BANDS.findIndex((b) => leveragePct >= b.min && leveragePct < b.max)
      if (idx >= 0) {
        rows[idx]!.borrowers += 1
        rows[idx]!.leverageSum += leveragePct
      }
    }
    return rows.map((r) => ({
      band: r.band,
      borrowers: r.borrowers,
      avgLeveragePct: r.borrowers ? r.leverageSum / r.borrowers : 0,
    }))
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

  const yLeft = adaptiveYAxisLayout(plotH, { minPxPerTick: 44, minWidth: 48, maxWidth: 60 })
  const yRight = adaptiveYAxisLayout(plotH, { minPxPerTick: 44, minWidth: 50, maxWidth: 64 })

  if (loading) return <div className="flex h-full min-h-0 flex-col gap-3 p-2"><Skeleton className="h-6 w-56" /><Skeleton className="flex-1 w-full rounded-xl" /></div>
  if (!loans.length) return <EmptyState title="No leverage data" description="Adjust filters to inspect borrower leverage." />

  return (
    <div ref={wrapRef} className="flex min-h-0 w-full flex-1 flex-col">
      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
        <BarChart data={data} margin={{ top: 10, right: 24, left: 24, bottom: 22 }}>
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="band"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            height={24}
            tickMargin={6}
            label={axisLabelBottom('Installment / monthly income')}
          />
          <YAxis
            yAxisId="left"
            tick={yLeft.tick}
            tickLine={false}
            axisLine={false}
            width={yLeft.width}
            tickMargin={yLeft.tickMargin}
            tickCount={yLeft.tickCount}
            interval="preserveStartEnd"
            label={axisLabelLeftVertical('Borrowers', yLeft.labelOffset)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={yRight.tick}
            tickLine={false}
            axisLine={false}
            width={yRight.width}
            tickMargin={yRight.tickMargin}
            tickCount={yRight.tickCount}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            interval="preserveStartEnd"
            label={axisLabelRightVertical('Avg leverage %', yRight.labelOffset)}
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
                  className="min-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)]">Band {row.band}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6"><dt>Borrowers</dt><dd className="font-semibold tabular-nums text-[var(--text)]">{row.borrowers.toLocaleString()}</dd></div>
                    <div className="flex justify-between gap-6"><dt>Avg leverage</dt><dd className="font-semibold tabular-nums text-[var(--text)]">{row.avgLeveragePct.toFixed(1)}%</dd></div>
                  </dl>
                </motion.div>
              )
            }}
          />
          <Bar yAxisId="left" dataKey="borrowers" fill={primary} radius={[6, 6, 0, 0]} />
          <Line yAxisId="right" dataKey="avgLeveragePct" stroke={primarySoft} strokeWidth={2.5} dot={{ r: 3, fill: primarySoft }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

