import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { formatCurrency } from '../../lib/format'
import { adaptiveYAxisLayout, axisBottomSpacing, axisLabelBottom, axisLabelLeftVertical, axisTickDefault, gridLine } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

const LGD_ASSUMPTION = 0.65
const GRADE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

const EXPOSURE_COLOR = '#818CF8'
const LOSS_COLOR = '#4338CA'

type Row = {
  grade: string
  recoverable: number
  estimatedLoss: number
  totalExposure: number
}

export function DefaultLossImpactCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [plotH, setPlotH] = useState(260)

  const data = useMemo<Row[]>(() => {
    const buckets = new Map<string, { exposure: number }>()
    for (const l of loans) {
      if (!l.earlyDefault) continue
      const cur = buckets.get(l.grade) ?? { exposure: 0 }
      cur.exposure += l.amount
      buckets.set(l.grade, cur)
    }
    return GRADE_ORDER.map((grade) => {
      const v = buckets.get(grade) ?? { exposure: 0 }
        const loss = v.exposure * LGD_ASSUMPTION
        return {
          grade,
          estimatedLoss: loss,
          recoverable: v.exposure - loss,
          totalExposure: v.exposure,
        }
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

  const yAxis = adaptiveYAxisLayout(plotH, { minPxPerTick: 46, minWidth: 54, maxWidth: 66 })
  const bottom = axisBottomSpacing({ hasXAxisLabel: true, hasLegend: true, denseTicks: false, extraBottom: 2, legendPaddingTop: 10 })

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 p-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  if (!data.length) {
    return <EmptyState title="No default loss data" description="No defaults in current filter window." />
  }

  return (
    <div ref={wrapRef} className="flex min-h-0 w-full flex-1 flex-col">
      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 22, bottom: bottom.bottomMargin }}>
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="grade"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            interval={0}
            height={bottom.xAxisHeight}
            tickMargin={6}
            tickFormatter={(v: string) => v}
            label={axisLabelBottom('Grade')}
          />
          <YAxis
            tick={yAxis.tick}
            tickLine={false}
            axisLine={false}
            width={yAxis.width}
            tickCount={yAxis.tickCount}
            tickMargin={yAxis.tickMargin}
            interval="preserveStartEnd"
            domain={[0, 'dataMax']}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1_000)}K`
            }
            label={axisLabelLeftVertical('Amount ($)', yAxis.labelOffset)}
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
                  className="min-w-[230px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)]">Grade {row.grade}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6">
                      <dt>Total exposure</dt>
                      <dd className="font-semibold tabular-nums text-[var(--text)]">{formatCurrency(row.totalExposure)}</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>Estimated loss</dt>
                      <dd className="font-semibold tabular-nums" style={{ color: 'var(--negative)' }}>{formatCurrency(row.estimatedLoss)}</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>Recoverable</dt>
                      <dd className="font-semibold tabular-nums" style={{ color: 'var(--positive)' }}>{formatCurrency(row.recoverable)}</dd>
                    </div>
                    <div className="flex justify-between gap-6 border-t border-[var(--border)] pt-1 mt-1">
                      <dt>Loss rate</dt>
                      <dd className="font-semibold tabular-nums">{(LGD_ASSUMPTION * 100).toFixed(0)}%</dd>
                    </div>
                  </dl>
                </motion.div>
              )
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: bottom.legendPaddingTop }}
            formatter={(value: string) => (value === 'estimatedLoss' ? 'Estimated loss' : 'Recoverable')}
          />
          <Bar
            dataKey="estimatedLoss"
            stackId="loss"
            fill={LOSS_COLOR}
            radius={[0, 0, 0, 0]}
            maxBarSize={38}
            minPointSize={4}
          />
          <Bar
            dataKey="recoverable"
            stackId="loss"
            fill={EXPOSURE_COLOR}
            radius={[6, 6, 0, 0]}
            maxBarSize={38}
            minPointSize={4}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
