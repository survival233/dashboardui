import type { DashboardConfig, GenericRow, KpiItem } from './types'

export type TimeRange = '30d' | '90d' | 'all'

export function asNumber(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

export function asDate(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v
  if (typeof v === 'string') {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

export function applyFilters(
  rows: GenericRow[],
  cfg: DashboardConfig,
  selected: Record<string, string[]>,
  range: TimeRange,
) {
  const maxDate = cfg.dateField
    ? rows.reduce<Date | null>((acc, r) => {
      const d = asDate(r[cfg.dateField!])
      if (!d) return acc
      if (!acc || d > acc) return d
      return acc
    }, null)
    : null

  return rows.filter((r) => {
    for (const [k, vals] of Object.entries(selected)) {
      if (!vals.length) continue
      if (!vals.includes(String(r[k] ?? ''))) return false
    }
    if (cfg.dateField && range !== 'all' && maxDate) {
      const d = asDate(r[cfg.dateField])
      if (!d) return false
      const days = range === '30d' ? 30 : 90
      const min = new Date(maxDate)
      min.setDate(min.getDate() - days)
      if (d < min) return false
    }
    return true
  })
}

export function buildKpis(rows: GenericRow[], cfg: DashboardConfig): KpiItem[] {
  const metric = cfg.metricField
  const vals = rows.map((r) => asNumber(r[metric]))
  const total = vals.reduce((a, b) => a + b, 0)
  const avg = vals.length ? total / vals.length : 0
  const count = rows.length

  let growth = 0
  if (cfg.dateField) {
    const sorted = [...rows]
      .map((r) => ({ d: asDate(r[cfg.dateField!]), m: asNumber(r[metric]) }))
      .filter((x) => x.d)
      .sort((a, b) => a.d!.getTime() - b.d!.getTime())
    const half = Math.floor(sorted.length / 2)
    if (half > 0) {
      const prev = sorted.slice(0, half).reduce((a, b) => a + b.m, 0)
      const curr = sorted.slice(half).reduce((a, b) => a + b.m, 0)
      growth = prev ? ((curr - prev) / prev) * 100 : 0
    }
  }

  return [
    { id: 'total', label: `Total ${cfg.labels[metric] ?? metric}`, value: total.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
    { id: 'avg', label: `Average ${cfg.labels[metric] ?? metric}`, value: avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
    { id: 'count', label: 'Record Count', value: count.toLocaleString() },
    { id: 'growth', label: 'Growth Rate', value: `${growth.toFixed(1)}%` },
  ]
}

export function groupByCategory(rows: GenericRow[], category: string, metric: string) {
  const map = new Map<string, number>()
  rows.forEach((r) => {
    const k = String(r[category] ?? 'Unknown')
    map.set(k, (map.get(k) ?? 0) + asNumber(r[metric]))
  })
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
}

export function histogram(rows: GenericRow[], metric: string, bins = 8) {
  const vals = rows.map((r) => asNumber(r[metric])).filter((v) => Number.isFinite(v))
  if (!vals.length) return []
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const step = (max - min || 1) / bins
  const out = Array.from({ length: bins }, (_, i) => ({
    bucket: `${(min + i * step).toFixed(0)}-${(min + (i + 1) * step).toFixed(0)}`,
    count: 0,
  }))
  vals.forEach((v) => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / step))
    out[idx]!.count += 1
  })
  return out
}
