import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { axisLabelStyle, axisMuted, axisTickDefault, gridLine, primary, primarySoft } from './chartTheme'
import { Skeleton } from '../ui/Skeleton'

const GRADE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

const RETURNS = [6.8, 9.2, 11.5, 13.8, 15.4, 16.9, 17.8] as const
const DEFAULT_RATES = [1.2, 2.8, 5.1, 8.4, 12.3, 18.7, 26.2] as const
const RISK_ADJUSTED = [5.6, 6.4, 6.4, 5.4, 3.1, -1.8, -8.4] as const

type Grade = (typeof GRADE_ORDER)[number]

interface Row {
  grade: Grade
  returnPct: number
  defaultRatePct: number
  riskAdjusted: number
}

export function GradeRiskReturnComboCard({ loading }: { loading: boolean }) {
  const data: Row[] = useMemo(
    () =>
      GRADE_ORDER.map((grade, i) => ({
        grade,
        returnPct: RETURNS[i]!,
        defaultRatePct: DEFAULT_RATES[i]!,
        riskAdjusted: RISK_ADJUSTED[i]!,
      })),
    [],
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-2 h-full min-h-0">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col" style={{ minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <ComposedChart
          data={data}
          margin={{
            top: 8,
            right: 32,
            left: 32,
            bottom: 20,
          }}
        >
        <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />

        {/* Bar baseline at 0 for risk-adjusted return */}
        <ReferenceLine y={0} stroke={axisMuted} strokeOpacity={0.35} strokeDasharray="3 6" />

          <XAxis
            dataKey="grade"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            height={24}
            tickMargin={6}
            interval={0}
          />

          <YAxis
            yAxisId="left"
            domain={[-10, 20]}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            width={44}
            tickMargin={8}
            tickCount={5}
            label={{ value: 'Return %', angle: -90, position: 'left', offset: 12, style: { ...axisLabelStyle } }}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 30]}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            width={44}
            tickMargin={8}
            tickCount={5}
            label={{ value: 'Default %', angle: 90, position: 'right', offset: 12, style: { ...axisLabelStyle } }}
          />

          <Tooltip
            cursor={{ fill: 'rgba(99,102,241,0.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0]?.payload as Row | undefined
              if (!row) return null
              const riskAdjustedPositive = row.riskAdjusted >= 0
              const defaultPositive = row.defaultRatePct <= 10
              return (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="min-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)]">Grade {row.grade}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6">
                      <dt>Risk-adjusted return</dt>
                      <dd
                        className="font-semibold tabular-nums"
                        style={{ color: riskAdjustedPositive ? 'var(--positive)' : 'var(--negative)' }}
                      >
                        {row.riskAdjusted.toFixed(1)}%
                      </dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>Return</dt>
                      <dd className="font-semibold tabular-nums text-[var(--text)]">{row.returnPct.toFixed(1)}%</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>Default rate</dt>
                      <dd
                        className="font-semibold tabular-nums"
                        style={{ color: defaultPositive ? 'var(--positive)' : 'var(--negative)' }}
                      >
                        {row.defaultRatePct.toFixed(1)}%
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              )
            }}
          />

          <Bar
            yAxisId="left"
            dataKey="riskAdjusted"
            name="riskAdjusted"
            fill={primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="returnPct"
            name="returnPct"
            stroke={primarySoft}
            strokeWidth={2.5}
            dot={{ r: 3, fill: primarySoft }}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="defaultRatePct"
            name="defaultRatePct"
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

