import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useDashboardStore } from '../../store/dashboardStore'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { formatCurrency } from '../../lib/format'
import { axisMuted } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

interface PurposeNode {
  name: string
  /** Treemap area weight (loan count) */
  value: number
  volume: number
  defaults: number
  defaultRate: number
}

interface TooltipState {
  x: number
  y: number
  node: PurposeNode
}

function abbreviatePhrase(words: string[], maxChars: number): string {
  if (!words.length) return ''
  // First try initials for multi-word phrases (e.g. "Home Improvement" -> "Home Imp.").
  if (words.length >= 2) {
    const head = words[0] ?? ''
    const tail = words[1] ?? ''
    const shortTail = tail.length > 3 ? `${tail.slice(0, 3)}.` : tail
    const candidate = `${head} ${shortTail}`.trim()
    if (candidate.length <= maxChars) return candidate
  }
  // Then try compact acronym for very small tiles.
  if (words.length >= 2) {
    const acronym = words.map((w) => w[0]?.toUpperCase() ?? '').join('')
    if (acronym.length <= maxChars) return acronym
  }
  // Fallback: single-word truncation.
  const base = words.join(' ')
  if (base.length <= maxChars) return base
  return `${base.slice(0, Math.max(1, maxChars - 1))}…`
}

function wrapTreemapLabel(label: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = label.split(/\s+/).filter(Boolean)
  if (!words.length) return [label]

  const lines: string[] = []
  let current = ''

  for (const w of words) {
    const next = current ? `${current} ${w}` : w
    if (next.length <= maxCharsPerLine) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = w
    if (lines.length >= maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)

  if (lines.length > maxLines) lines.length = maxLines
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1] ?? ''
    if (last.length > maxCharsPerLine) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(1, maxCharsPerLine - 1))}…`
    }
  }

  // If wrapping still produced clipped/oversized content in constrained tiles,
  // replace with a reusable abbreviation strategy rather than hardcoding values.
  if (lines.some((line) => line.length > maxCharsPerLine)) {
    return [abbreviatePhrase(words, maxCharsPerLine)]
  }

  if (maxLines === 1 && lines.length === 1 && words.length >= 2 && lines[0]!.length >= Math.max(8, maxCharsPerLine - 1)) {
    const abbreviated = abbreviatePhrase(words, maxCharsPerLine)
    return [abbreviated]
  }

  return lines
}

function clampLabelPart(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`
}

export function TreemapCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()
  const setCross = useDashboardStore((s) => s.setCross)
  const cross = useDashboardStore((s) => s.cross)

  const containerRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 380 })
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = (wIn?: number, hIn?: number) => {
      const w = wIn ?? el.clientWidth
      const h = hIn ?? el.getBoundingClientRect().height
      if (w && w > 0 && h && h > 0) setSize({ w, h: Math.max(140, Math.round(h)) })
    }

    measure()
    // One extra frame helps avoid first-paint "squeezed" layouts when the card is still resolving height.
    requestAnimationFrame(() => measure())

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        measure(entry.contentRect.width, entry.contentRect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const nodes = useMemo(() => {
    const map = new Map<string, { count: number; volume: number; defaults: number }>()
    for (const l of loans) {
      const cur = map.get(l.purpose) ?? { count: 0, volume: 0, defaults: 0 }
      cur.count += 1
      cur.volume += l.amount
      if (l.earlyDefault) cur.defaults += 1
      map.set(l.purpose, cur)
    }
    return [...map.entries()]
      .map(
        ([name, d]): PurposeNode => ({
          name,
          value: d.count,
          volume: d.volume,
          defaults: d.defaults,
          defaultRate: d.count > 0 ? (d.defaults / d.count) * 100 : 0,
        }),
      )
      .sort((a, b) => b.value - a.value)
  }, [loans])

  const maxVolume = useMemo(() => Math.max(...nodes.map((n) => n.volume), 1), [nodes])

  const colorScale = useMemo(
    () =>
      d3
        .scaleSequential()
        .domain([0, maxVolume])
        .interpolator((t: number) => d3.interpolateRgb('#E0E7FF', '#4338CA')(t)),
    [maxVolume],
  )

  const legendH = Math.round(legendRef.current?.getBoundingClientRect().height ?? 0)
  const svgH = Math.max(110, size.h - Math.max(legendH, 0) - 8)

  const treemapLayout = useMemo(() => {
    if (!nodes.length) return []
    const root = d3
      .hierarchy({ children: nodes } as any)
      .sum((d: any) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    d3
      .treemap<any>()
      .size([size.w, svgH])
      .paddingInner(3)
      .paddingOuter(4)
      .round(true)(root)

    return root.leaves() as d3.HierarchyRectangularNode<PurposeNode>[]
  }, [nodes, size, svgH])

  const handleClick = useCallback(
    (name: string) => {
      setCross({ purpose: cross.purpose === name ? null : name })
    },
    [cross.purpose, setCross],
  )

  const handleMouseMove = useCallback((e: React.MouseEvent, node: PurposeNode) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, node })
  }, [])

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 p-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  if (!nodes.length) {
    return <EmptyState title="No purpose data" description="Adjust filters to see loan purpose breakdown." />
  }

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 w-full flex-1 flex-col"
      style={{ minHeight: 0, padding: 0 }}
    >
      {/* Legend */}
      <div ref={legendRef} className="mb-3 flex items-center gap-2" style={{ padding: '0 4px' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: axisMuted }}>Low volume</span>
        <div
          className="h-2.5 flex-1 rounded-full"
          style={{
            maxWidth: 180,
            background: `linear-gradient(to right, ${colorScale(0)}, ${colorScale(maxVolume * 0.33)}, ${colorScale(
              maxVolume * 0.66,
            )}, ${colorScale(maxVolume)})`,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: axisMuted }}>High volume</span>
      </div>

      {/*
        Reserve space for the legend above; use the remaining container height for the treemap SVG.
        This keeps the component proportional and prevents overflow in a no-scroll layout.
      */}
      <svg
        viewBox={`0 0 ${size.w} ${svgH}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', minHeight: 160, overflow: 'hidden', display: 'block', flex: 1 }}
      >
        <defs>
          {treemapLayout.map((leaf, i) => {
            const cw = leaf.x1 - leaf.x0
            const ch = leaf.y1 - leaf.y0
            return (
              <clipPath key={`c-${i}`} id={`tm-clip-${i}`}>
                <rect x={leaf.x0} y={leaf.y0} width={cw} height={ch} rx={6} ry={6} />
              </clipPath>
            )
          })}
        </defs>

        {treemapLayout.map((leaf, i) => {
          const d = leaf.data
          const x = leaf.x0
          const y = leaf.y0
          const w = leaf.x1 - leaf.x0
          const h = leaf.y1 - leaf.y0
          const fill = colorScale(d.volume)
          const isSelected = cross.purpose === d.name
          const isDimmed = cross.purpose && !isSelected
          const luminance = d3.hsl(fill).l
          const textColor = luminance < 0.55 ? '#fff' : '#1a202c'
          const pad = Math.min(6, w * 0.06)
          const titlePx = w < 64 ? 10 : w < 110 ? 11 : 12.5
          const approxCharW = titlePx * 0.52
          const maxTitleChars = Math.max(2, Math.floor((w - pad * 2) / approxCharW))
          // Prefer a visual "<br/>" behavior for longer two-word labels.
          const canUseTwoLines = h >= 42
          const maxTitleLines = canUseTwoLines ? 2 : 1
          const words = d.name.split(/\s+/).filter(Boolean)
          const forceTwoLineSplit =
            canUseTwoLines &&
            words.length === 2 &&
            d.name.length > Math.max(8, maxTitleChars - 1)

          const titleLines = forceTwoLineSplit
            ? [
                clampLabelPart(words[0] ?? '', maxTitleChars),
                clampLabelPart(words[1] ?? '', maxTitleChars),
              ]
            : wrapTreemapLabel(d.name, maxTitleChars, maxTitleLines)
          const showLabel = w >= 32 && h >= 22
          const titleLineGap = titlePx + 2
          const titleBlockH = titleLines.length * titleLineGap
          const showLoansLine = w >= 78 && h >= Math.max(46, titleBlockH + 20)
          const showVolLine = w >= 78 && h >= Math.max(60, titleBlockH + 34)
          const titleY = y + Math.min(titlePx + 4, h * 0.38)
          const loansY = Math.min(titleY + titleBlockH + 6, y + h * 0.72)
          const volY = Math.min(loansY + 13, y + h * 0.88)

          return (
            <g key={d.name} clipPath={`url(#tm-clip-${i})`}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={6}
                fill={fill}
                stroke={isSelected ? '#6366F1' : 'rgba(255,255,255,0.6)'}
                strokeWidth={isSelected ? 2.5 : 1}
                opacity={isDimmed ? 0.3 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s, stroke-width 0.15s' }}
                onClick={() => handleClick(d.name)}
                onMouseMove={(e) => handleMouseMove(e, d)}
                onMouseLeave={() => setTooltip(null)}
              />
              {showLabel && (
                <>
                  <text
                    x={x + pad}
                    y={titleY}
                    style={{
                      fontSize: `${titlePx}px`,
                      fontWeight: 700,
                      fill: textColor,
                      pointerEvents: 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {titleLines.map((line, li) => (
                      <tspan key={`${d.name}-${li}`} x={x + pad} dy={li === 0 ? 0 : titleLineGap}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                  {showLoansLine && (
                    <text
                      x={x + pad}
                      y={loansY}
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        fill: textColor,
                        opacity: 0.85,
                        pointerEvents: 'none',
                      }}
                    >
                      {d.value.toLocaleString()} loans
                    </text>
                  )}
                  {showVolLine && (
                    <text
                      x={x + pad}
                      y={volY}
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        fill: textColor,
                        opacity: 0.75,
                        pointerEvents: 'none',
                      }}
                    >
                      {formatCurrency(d.volume)}
                    </text>
                  )}
                </>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="pointer-events-none absolute z-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] shadow-[var(--shadow-sm)]"
          style={{
            left: Math.min(tooltip.x + 14, size.w - 200),
            top: Math.max(tooltip.y - 80, 8),
          }}
        >
          <p className="font-semibold capitalize text-[var(--text)]">{tooltip.node.name}</p>
          <dl className="mt-2 space-y-1 text-[var(--text-muted)]">
            <div className="flex justify-between gap-6">
              <dt>Loans</dt>
              <dd className="font-medium tabular-nums text-[var(--text)]">{tooltip.node.value.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt>Volume</dt>
              <dd className="font-medium tabular-nums text-[var(--text)]">{formatCurrency(tooltip.node.volume)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt>Default rate</dt>
              <dd
                className="font-semibold tabular-nums"
                style={{
                  color: tooltip.node.defaultRate > 5 ? 'var(--negative)' : 'var(--text)',
                }}
              >
                {tooltip.node.defaultRate.toFixed(2)}%
              </dd>
            </div>
          </dl>
        </motion.div>
      )}
    </div>
  )
}

