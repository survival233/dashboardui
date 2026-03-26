import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import type { Loan } from '../data/lcLoans'
import { useDashboardStore } from '../store/dashboardStore'
import { adaptiveYAxisLayout, axisBottomSpacing, axisLabelBottom, axisLabelLeftVertical, axisTickDefault, gridLine, primary } from '../components/charts/chartTheme'
import { applyFilters, asDate, buildKpis, groupByCategory, histogram } from './engine'
import { buildDefaultConfig, detectSchema } from './schema'
import type { DashboardConfig, GenericRow } from './types'

function toRows(loans: Loan[]): GenericRow[] {
  return loans.map((l) => ({ ...l }))
}

export function AnalyticsFramework() {
  const loans = useDashboardStore((s) => s.loans)
  const loading = useDashboardStore((s) => s.loading)
  const rows = useMemo(() => toRows(loans), [loans])
  const schema = useMemo(() => detectSchema(rows), [rows])
  const defaultCfg = useMemo(() => buildDefaultConfig(schema), [schema])
  const [cfg, setCfg] = useState<DashboardConfig>(defaultCfg)
  const [range, setRange] = useState<'30d' | '90d' | 'all'>('all')
  const [stacked, setStacked] = useState(true)
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [drill, setDrill] = useState<{ field: string; value: string } | null>(null)

  const filtered = useMemo(() => applyFilters(rows, cfg, selected, range), [rows, cfg, selected, range])
  const kpis = useMemo(() => buildKpis(filtered, cfg), [filtered, cfg])

  const primaryData = useMemo(() => {
    if (cfg.dateField) {
      const map = new Map<string, number>()
      filtered.forEach((r) => {
        const d = asDate(r[cfg.dateField!])
        if (!d) return
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        map.set(key, (map.get(key) ?? 0) + Number(r[cfg.metricField] ?? 0))
      })
      return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)).slice(-18)
    }
    const cat = cfg.categoryFields[0]
    return cat ? groupByCategory(filtered, cat, cfg.metricField) : []
  }, [cfg, filtered])

  const supportA = useMemo(() => {
    const cat = cfg.categoryFields[0]
    return cat ? groupByCategory(filtered, cat, cfg.metricField) : []
  }, [cfg, filtered])
  const supportB = useMemo(() => histogram(filtered, cfg.metricField, 10), [cfg, filtered])
  const supportC = useMemo(() => {
    const cat = cfg.categoryFields[1]
    const metric = cfg.secondaryMetricField ?? cfg.metricField
    return cat ? groupByCategory(filtered, cat, metric) : []
  }, [cfg, filtered])

  const filterFields = cfg.categoryFields.slice(0, 3)
  const filterOptions = useMemo(() => {
    const out: Record<string, string[]> = {}
    filterFields.forEach((f) => {
      out[f] = [...new Set(rows.map((r) => String(r[f] ?? 'Unknown')))].sort().slice(0, 40)
    })
    return out
  }, [rows, filterFields])

  const drillRows = useMemo(() => {
    if (!drill) return []
    return filtered.filter((r) => String(r[drill.field] ?? 'Unknown') === drill.value).slice(0, 8)
  }, [filtered, drill])

  const y = adaptiveYAxisLayout(280)
  const bottom = axisBottomSpacing({ hasLegend: true, hasXAxisLabel: true, denseTicks: true })

  return (
    <div className="framework-shell">
      <header className="framework-top">
        <h1>Reusable Analytics Framework</h1>
        <div className="framework-controls">
          <select value={cfg.metricField} onChange={(e) => setCfg({ ...cfg, metricField: e.target.value })}>
            {schema.numericFields.map((f) => <option key={f} value={f}>{cfg.labels[f] ?? f}</option>)}
          </select>
          <select value={cfg.dateField ?? ''} onChange={(e) => setCfg({ ...cfg, dateField: e.target.value || undefined })}>
            <option value="">No Date Field</option>
            {schema.dateFields.map((f) => <option key={f} value={f}>{cfg.labels[f] ?? f}</option>)}
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value as any)}>
            <option value="30d">30D</option>
            <option value="90d">90D</option>
            <option value="all">All</option>
          </select>
        </div>
      </header>

      <section className="framework-kpis">
        {kpis.slice(0, 4).map((k) => (
          <article key={k.id} className="framework-kpi">
            <p>{k.label}</p>
            <h3>{k.value}</h3>
          </article>
        ))}
      </section>

      <section className="framework-filters">
        {filterFields.map((f) => (
          <label key={f}>
            <span>{cfg.labels[f] ?? f}</span>
            <select
              value={selected[f]?.[0] ?? ''}
              onChange={(e) => setSelected((s) => ({ ...s, [f]: e.target.value ? [e.target.value] : [] }))}
            >
              <option value="">All</option>
              {filterOptions[f]?.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        ))}
        <button type="button" onClick={() => setSelected({})}>Clear Filters</button>
      </section>

      <main className="framework-grid">
        <article className="framework-card framework-card--primary">
          <h3>Primary Visualization</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={primaryData} margin={{ top: 12, right: 12, left: 22, bottom: bottom.bottomMargin }}>
              <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
              <XAxis dataKey="name" tick={axisTickDefault} tickLine={false} axisLine={false} height={bottom.xAxisHeight} label={axisLabelBottom(cfg.dateField ? 'Time' : (cfg.labels[cfg.categoryFields[0] ?? ''] ?? 'Category'))} />
              <YAxis tick={y.tick} tickLine={false} axisLine={false} tickCount={y.tickCount} width={y.width} label={axisLabelLeftVertical(cfg.labels[cfg.metricField] ?? cfg.metricField, y.labelOffset)} />
              <Tooltip />
              <Legend verticalAlign="bottom" />
              {cfg.dateField ? (
                <Line type="monotone" dataKey="value" stroke={primary} strokeWidth={2.5} dot={false} />
              ) : (
                <Bar dataKey="value" fill={primary}>
                  {primaryData.map((_, i) => <Cell key={i} fillOpacity={0.35 + (i / Math.max(1, primaryData.length - 1)) * 0.6} fill={primary} />)}
                </Bar>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </article>

        <article className="framework-card">
          <h3>Category Breakdown</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supportA} margin={{ top: 10, right: 10, left: 20, bottom: 28 }}>
              <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
              <XAxis dataKey="name" tick={axisTickDefault} tickLine={false} axisLine={false} height={24} />
              <YAxis tick={axisTickDefault} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill={primary} onClick={(d: any) => setDrill({ field: cfg.categoryFields[0] ?? 'name', value: d?.name ?? '' })} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="framework-card">
          <h3>Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supportB} margin={{ top: 10, right: 10, left: 20, bottom: 28 }}>
              <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
              <XAxis dataKey="bucket" tick={axisTickDefault} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={axisTickDefault} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill={primary} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="framework-card">
          <h3>Comparison</h3>
          <div className="framework-toggle">
            <button onClick={() => setStacked(false)} className={!stacked ? 'on' : ''}>Grouped</button>
            <button onClick={() => setStacked(true)} className={stacked ? 'on' : ''}>Stacked</button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supportC} margin={{ top: 10, right: 10, left: 20, bottom: 28 }}>
              <CartesianGrid stroke={gridLine} vertical={false} strokeDasharray="3 6" />
              <XAxis dataKey="name" tick={axisTickDefault} tickLine={false} axisLine={false} />
              <YAxis tick={axisTickDefault} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#818CF8" stackId={stacked ? 's' : undefined} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </main>

      <section className="framework-drill">
        <h4>Drill-down {drill ? `(${drill.field}: ${drill.value})` : ''}</h4>
        <div className="framework-table-wrap">
          <table>
            <thead><tr>{Object.keys(filtered[0] ?? {}).slice(0, 6).map((k) => <th key={k}>{cfg.labels[k] ?? k}</th>)}</tr></thead>
            <tbody>
              {(drill ? drillRows : filtered.slice(0, 8)).map((r, i) => (
                <tr key={i}>{Object.keys(filtered[0] ?? {}).slice(0, 6).map((k) => <td key={k}>{String(r[k] ?? '')}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {loading && <div className="framework-loading">Loading data...</div>}
    </div>
  )
}
