import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { axisMuted, axisTickDefault, gridLine, primary } from './chartTheme'
import { Skeleton } from '../ui/Skeleton'

const SEGMENTS: Array<{ label: string; value: number }> = [
  { label: 'Rent + <2yr emp + <$40K income', value: 14.2 },
  { label: 'Rent + <2yr employment', value: 11.8 },
  { label: 'Rent + income <$40K', value: 9.6 },
  { label: 'Employment <2 years', value: 8.4 },
  { label: 'Renter (any)', value: 6.8 },
  { label: 'Income <$40K', value: 5.9 },
  { label: 'Mortgage holder', value: 3.4 },
  { label: 'Own home + 5yr+ employment', value: 2.1 },
]

type Row = { segment: string; defaultRate: number }

function wrapSegmentLabel(label: string): [string, string] {
  const parts = label.split(' + ')
  if (parts.length <= 1) return [label, '']
  const line1 = parts[0] ?? label
  const rest = parts.slice(1).join(' + ')
  const max = 26
  const line2 = rest.length > max ? `${rest.slice(0, max - 1)}…` : rest
  return [line1, line2]
}

function SegmentTick({
  x,
  y,
  payload,
  fontSize,
}: {
  x?: number | string
  y?: number | string
  payload?: { value?: string | number }
  fontSize: number
}) {
  const label = String(payload?.value ?? '')
  const [l1, l2] = wrapSegmentLabel(label)
  const fs = fontSize

  const xVal = x ?? 0
  const yVal = y ?? 0

  return (
    <text
      x={xVal}
      y={yVal}
      textAnchor="end"
      fill={axisMuted}
      style={{ fontSize: fs, fontWeight: 600, pointerEvents: 'none' }}
    >
      <tspan x={xVal} dy={0}>
        {l1}
      </tspan>
      {l2 && (
        <tspan x={xVal} dy={14}>
          {l2}
        </tspan>
      )}
    </text>
  )
}

export function SegmentDefaultRatesBarCard({ loading }: { loading: boolean }) {
  const data: Row[] = useMemo(() => {
    const rows = [...SEGMENTS]
      .map((d) => ({ segment: d.label, defaultRate: d.value }))
      .sort((a, b) => b.defaultRate - a.defaultRate)
    return rows
  }, [])
  const [minRate, maxRate] = useMemo(() => {
    const vals = data.map((d) => d.defaultRate)
    return [Math.min(...vals), Math.max(...vals)]
  }, [data])

  // Measure width for Y-axis only — never take >~38% of width or bars get squeezed.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(400)
  const [plotH, setPlotH] = useState(260)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.max(200, Math.round(rect.width || el.clientWidth || 400))
      const h = Math.max(140, Math.round(rect.height || 260))
      setContainerW(w)
      setPlotH(h)
    }
    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-2 h-full min-h-0">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  const tickFontSize = plotH < 240 ? 9 : 10

  // Enough room for 2-line ticks without stealing the bar area (was up to 60% width).
  const yAxisW = Math.min(188, Math.max(96, Math.round(containerW * 0.34)))

  return (
    <div
      ref={wrapRef}
      className="relative flex min-h-0 w-full flex-1 flex-col"
      style={{ minHeight: 0 }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 12, left: 4, bottom: 10 }}
        >
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />

          <XAxis
            type="number"
            dataKey="defaultRate"
            domain={[0, 16]}
            tick={{ ...axisTickDefault, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            type="category"
            dataKey="segment"
            tick={(props) => <SegmentTick {...props} fontSize={tickFontSize} />}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            width={yAxisW}
          />

          <ReferenceLine
            x={4.8}
            stroke={primary}
            strokeDasharray="4 4"
            strokeOpacity={0.7}
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
                  <p className="font-semibold text-[var(--text)]">{row.segment}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6">
                      <dt>Default rate</dt>
                      <dd className="font-semibold tabular-nums" style={{
                        color: row.defaultRate > 8 ? 'var(--negative)' : 'var(--text)',
                      }}>
                        {row.defaultRate.toFixed(1)}%
                      </dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>Portfolio avg</dt>
                      <dd className="font-medium tabular-nums text-[var(--text)]">
                        4.8
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              )
            }}
          />

          <Bar
            dataKey="defaultRate"
            name="Default rate"
            radius={[8, 8, 8, 8]}
            maxBarSize={26}
          >
            {data.map((row) => {
              const denom = maxRate - minRate || 1
              const t = (row.defaultRate - minRate) / denom
              // Indigo intensity scale: low rates lighter, high rates stronger.
              const alpha = 0.3 + t * 0.7
              return <Cell key={row.segment} fill={primary} fillOpacity={alpha} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

