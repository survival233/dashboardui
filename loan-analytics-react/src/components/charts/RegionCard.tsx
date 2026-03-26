import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, GeoJsonProperties, Geometry } from 'geojson'
import { aggregateRegion, useDashboardStore } from '../../store/dashboardStore'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { formatCurrency } from '../../lib/format'
import { axisMuted } from './chartTheme'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

const US_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const STATE_FIPS_TO_ABBR: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
}

type StateFeature = Feature<Geometry, GeoJsonProperties & { name: string }>

interface TooltipState {
  x: number
  y: number
  state: string
  volume: number
  count: number
}

export function RegionCard({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()
  const setCross = useDashboardStore((s) => s.setCross)
  const cross = useDashboardStore((s) => s.cross)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [topoData, setTopoData] = useState<Topology | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const [containerHeight, setContainerHeight] = useState(320)

  useEffect(() => {
    fetch(US_ATLAS_URL).then((r) => r.json()).then((d) => setTopoData(d as Topology))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth || 600)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (w > 0) setContainerWidth(w)
        if (h > 0) setContainerHeight(h)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const regionData = useMemo(() => {
    const agg = aggregateRegion(loans)
    const map = new Map<string, { volume: number; count: number }>()
    for (const d of agg) map.set(d.name, { volume: d.volume, count: d.count })
    return map
  }, [loans])

  const maxVolume = useMemo(() => {
    let max = 0
    for (const v of regionData.values()) if (v.volume > max) max = v.volume
    return max
  }, [regionData])

  const colorScale = useMemo(() => {
    return d3.scaleSequential()
      .domain([0, maxVolume || 1])
      .interpolator((t: number) => d3.interpolateRgb('#E0E7FF', '#4338CA')(t))
  }, [maxVolume])

  const features = useMemo<StateFeature[]>(() => {
    if (!topoData) return []
    const geom = topoData.objects.states as GeometryCollection
    return topojson.feature(topoData, geom).features as StateFeature[]
  }, [topoData])

  // Reserve space at the top for the legend and internal padding.
  const mapHeight = Math.max(160, Math.round(containerHeight - 52))

  const projection = useMemo(() => {
    if (!features.length) return d3.geoAlbersUsa().scale(800).translate([containerWidth / 2, mapHeight / 2])
    return d3.geoAlbersUsa().fitSize([containerWidth, mapHeight], {
      type: 'FeatureCollection' as const,
      features,
    })
  }, [containerWidth, mapHeight, features])

  const pathGen = useMemo(() => d3.geoPath().projection(projection), [projection])

  const getStateAbbr = useCallback((feature: StateFeature): string => {
    const id = String(feature.id).padStart(2, '0')
    return STATE_FIPS_TO_ABBR[id] ?? ''
  }, [])

  const handleClick = useCallback((abbr: string) => {
    if (!abbr) return
    setCross({ region: cross.region === abbr ? null : abbr })
  }, [cross.region, setCross])

  const handleMouseMove = useCallback((e: React.MouseEvent, feature: StateFeature) => {
    const abbr = getStateAbbr(feature)
    const d = regionData.get(abbr)
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      state: feature.properties?.name ?? abbr,
      volume: d?.volume ?? 0,
      count: d?.count ?? 0,
    })
  }, [getStateAbbr, regionData])

  if (loading || !topoData) {
    return (
      <div className="flex h-full flex-col gap-3 p-4 min-h-0">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  if (!loans.length) {
    return <EmptyState title="No regional data" description="Adjust filters to compare funded volume by geography." />
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: '100%', height: '100%', minHeight: 0, padding: 0 }}
    >
      {/* Legend */}
      <div className="mb-2 flex items-center gap-2">
        <span style={{ fontSize: 11, fontWeight: 500, color: axisMuted }}>Low</span>
        <div
          className="h-2.5 flex-1 rounded-full"
          style={{
            maxWidth: 160,
            background: `linear-gradient(to right, ${colorScale(0)}, ${colorScale(maxVolume * 0.5)}, ${colorScale(maxVolume)})`,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: axisMuted }}>High</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${containerWidth || 600} ${mapHeight}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {features.map((feature) => {
          const abbr = getStateAbbr(feature)
          const d = regionData.get(abbr)
          const vol = d?.volume ?? 0
          const fill = vol > 0 ? colorScale(vol) : '#F1F5F9'
          const isSelected = cross.region === abbr
          const isDimmed = cross.region && !isSelected

          return (
            <path
              key={String(feature.id)}
              d={pathGen(feature) ?? ''}
              fill={fill}
              stroke={isSelected ? '#4338CA' : '#fff'}
              strokeWidth={isSelected ? 2 : 0.5}
              opacity={isDimmed ? 0.35 : 1}
              style={{ cursor: 'pointer', transition: 'fill 0.2s, opacity 0.2s, stroke-width 0.15s' }}
              onClick={() => handleClick(abbr)}
              onMouseMove={(e) => handleMouseMove(e, feature)}
              onMouseLeave={() => setTooltip(null)}
            />
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
            left: Math.min(tooltip.x + 12, (containerWidth || 600) - 180),
            top: tooltip.y - 10,
          }}
        >
          <p className="font-semibold text-[var(--text)]">{tooltip.state}</p>
          <p className="mt-1 text-[var(--text-muted)]">
            Volume{' '}
            <span className="font-medium tabular-nums text-[var(--text)]">
              {formatCurrency(tooltip.volume)}
            </span>
          </p>
          <p className="mt-0.5 text-[var(--text-muted)]">
            Loans{' '}
            <span className="font-medium tabular-nums text-[var(--text)]">
              {tooltip.count.toLocaleString()}
            </span>
          </p>
        </motion.div>
      )}
    </div>
  )
}
