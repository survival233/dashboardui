import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { axisLabelBottom, axisLabelLeftVertical, axisMuted, axisTickDefault, gridLine, primary, primarySoft } from './chartTheme'
import { Skeleton } from '../ui/Skeleton'

const DATA: Array<{
  year: number
  'A-B': number
  C: number
  'D-E': number
  'F-G': number
}> = [
  { year: 2021, 'A-B': 50, C: 22, 'D-E': 22, 'F-G': 6 },
  { year: 2022, 'A-B': 47, C: 21, 'D-E': 24, 'F-G': 8 },
  { year: 2023, 'A-B': 45, C: 20, 'D-E': 25, 'F-G': 10 },
  { year: 2024, 'A-B': 42, C: 20, 'D-E': 26, 'F-G': 12 },
]

export function GradeDistributionAreaCard({ loading }: { loading: boolean }) {
  const data = useMemo(() => DATA, [])

  const wrapRef = useRef<HTMLDivElement>(null)
  const [chartH, setChartH] = useState(220)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const update = () => {
      const h = Math.max(100, Math.round(el.getBoundingClientRect().height || 220))
      setChartH(h)
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (loading) {
    return (
      <div ref={wrapRef} className="flex flex-col gap-3 p-2 h-full min-h-0">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <ResponsiveContainer width="100%" height={chartH}>
        <AreaChart data={data} margin={{ top: 12, right: 16, left: 22, bottom: 22 }}>
          <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="year"
            tick={axisTickDefault}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => String(v)}
            height={24}
            tickMargin={6}
            label={axisLabelBottom('Year')}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tickLine={false}
            axisLine={false}
            tick={axisTickDefault}
            width={56}
            tickMargin={8}
            tickCount={5}
            label={axisLabelLeftVertical('Share %', 8)}
          />
          <Tooltip
            cursor={{ strokeDasharray: '4 4', stroke: axisMuted, strokeOpacity: 0.6 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const byKey = new Map<string, number>()
              for (const p of payload as any[]) {
                if (!p?.dataKey) continue
                byKey.set(String(p.dataKey), Number(p.value) || 0)
              }
              const get = (k: string) => byKey.get(k) ?? 0
              return (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="min-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
                >
                  <p className="font-semibold text-[var(--text)]">Year {String(label)}</p>
                  <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
                    <div className="flex justify-between gap-6">
                      <dt>A-B</dt>
                      <dd className="font-semibold tabular-nums text-[var(--text)]">{get('A-B').toFixed(0)}%</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>C</dt>
                      <dd className="font-semibold tabular-nums text-[var(--text)]">{get('C').toFixed(0)}%</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>D-E</dt>
                      <dd className="font-semibold tabular-nums text-[var(--text)]">{get('D-E').toFixed(0)}%</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt>F-G</dt>
                      <dd className="font-semibold tabular-nums text-[var(--text)]">{get('F-G').toFixed(0)}%</dd>
                    </div>
                  </dl>
                </motion.div>
              )
            }}
          />

          {/* Stack order bottom to top: A-B, C, D-E, F-G */}
          <Area
            type="monotone"
            dataKey="A-B"
            stackId="grades"
            stroke={primary}
            fill={primary}
            fillOpacity={0.35}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="C"
            stackId="grades"
            stroke={primarySoft}
            fill={primarySoft}
            fillOpacity={0.30}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="D-E"
            stackId="grades"
            stroke="#14B8A6"
            fill="#14B8A6"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="F-G"
            stackId="grades"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.20}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

