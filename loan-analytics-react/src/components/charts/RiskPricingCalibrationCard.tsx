import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { axisLabelBottom, axisLabelLeftVertical, axisLabelRightVertical, axisTickDefault, gridLine, primary, primarySoft } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

const GRADE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

type Row = {
  grade: string
  avgRate: number
  defaultRate: number
  excessSpread: number
}

export function RiskPricingCalibrationCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()

  const data = useMemo<Row[]>(() => {
    const byGrade = new Map<string, { n: number; rateSum: number; defaults: number }>()
    for (const l of loans) {
      const cur = byGrade.get(l.grade) ?? { n: 0, rateSum: 0, defaults: 0 }
      cur.n += 1
      cur.rateSum += l.rate
      if (l.earlyDefault) cur.defaults += 1
      byGrade.set(l.grade, cur)
    }
    return GRADE_ORDER.map((grade) => {
      const cur = byGrade.get(grade) ?? { n: 0, rateSum: 0, defaults: 0 }
      const avgRate = cur.n ? cur.rateSum / cur.n : 0
      const defaultRate = cur.n ? (cur.defaults / cur.n) * 100 : 0
      return {
        grade,
        avgRate,
        defaultRate,
        excessSpread: avgRate - defaultRate,
      }
    })
  }, [loans])

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 p-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  if (!loans.length) {
    return <EmptyState title="No pricing data" description="Adjust filters to evaluate risk pricing by grade." />
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
        <ComposedChart data={data} margin={{ top: 10, right: 26, left: 26, bottom: 22 }}>
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="grade" tick={axisTickDefault} tickLine={false} axisLine={false} height={24} tickMargin={6} label={axisLabelBottom('Grade')} />
          <YAxis
            yAxisId="left"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            width={50}
            tickMargin={8}
            tickCount={5}
            label={axisLabelLeftVertical('APR / spread %', 8)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            width={50}
            tickMargin={8}
            tickCount={5}
            label={axisLabelRightVertical('Default %', 8)}
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
                  className="min-w-[210px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)]">Grade {row.grade}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6"><dt>Avg APR</dt><dd className="font-semibold tabular-nums">{row.avgRate.toFixed(2)}%</dd></div>
                    <div className="flex justify-between gap-6"><dt>Default rate</dt><dd className="font-semibold tabular-nums">{row.defaultRate.toFixed(2)}%</dd></div>
                    <div className="flex justify-between gap-6"><dt>Excess spread</dt><dd className="font-semibold tabular-nums">{row.excessSpread.toFixed(2)}%</dd></div>
                  </dl>
                </motion.div>
              )
            }}
          />
          <Bar yAxisId="left" dataKey="excessSpread" fill={primary} radius={[6, 6, 0, 0]} maxBarSize={34} />
          <Line yAxisId="left" dataKey="avgRate" stroke={primarySoft} strokeWidth={2.5} dot={{ r: 3, fill: primarySoft }} />
          <Line yAxisId="right" dataKey="defaultRate" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="6 6" dot={{ r: 3, fill: '#EF4444' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

