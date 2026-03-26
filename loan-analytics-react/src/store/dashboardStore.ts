import { create } from 'zustand'
import { startOfYear, subDays } from 'date-fns'
import { loadLcLoans, type Loan } from '../data/lcLoans'

export type Timeframe = '7d' | '30d' | '90d' | 'ytd' | 'all'

export type CrossFilters = {
  region: string | null
  regions: string[]
  purpose: string | null
  purposes: string[]
  grade: string | null
  grades: string[]
  monthKey: string | null
}

type BrushRange = { start: number; end: number } | null
const KPI_DEFAULT = ['originations', 'volume', 'avgRate', 'dqRate'] as const
export type KpiId = (typeof KPI_DEFAULT)[number]
const CHART_DEFAULT = [
  'region',
  'treemap',
  'gradeRiskReturn',
  'segmentDefaultRates',
  'defaultLossImpact',
] as const
export type ChartId = (typeof CHART_DEFAULT)[number]

/** All chart ids in default order — use to reconcile in-memory state after HMR or catalog changes */
export const CHART_CATALOG: readonly ChartId[] = CHART_DEFAULT

/** v2: new chart ids are prepended (not appended) so added charts stay visible without scrolling past old order */
const CHART_ORDER_KEY = 'dash-chart-order-v2'
const LEGACY_CHART_ORDER_KEY = 'dash-chart-order'

function loadOrder<T extends string>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as string[]
    const set = new Set(fallback)
    const ordered = parsed.filter((x): x is T => set.has(x as T))
    const missing = fallback.filter((x) => !ordered.includes(x))
    return [...missing, ...ordered]
  } catch { return fallback }
}

function loadChartOrder(): ChartId[] {
  const fallback = [...CHART_DEFAULT]
  const parse = (raw: string | null): ChartId[] | null => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as string[]
      const valid = new Set(fallback)
      const seen = new Set<string>()
      const ordered = parsed.filter((x): x is ChartId => {
        if (!valid.has(x as ChartId) || seen.has(x)) return false
        seen.add(x)
        return true
      })
      const missing = fallback.filter((x) => !ordered.includes(x))
      return [...missing, ...ordered]
    } catch {
      return null
    }
  }
  let merged = parse(typeof localStorage !== 'undefined' ? localStorage.getItem(CHART_ORDER_KEY) : null)
  if (!merged) merged = parse(typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_CHART_ORDER_KEY) : null)
  if (!merged) merged = fallback
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CHART_ORDER_KEY, JSON.stringify(merged))
      localStorage.removeItem(LEGACY_CHART_ORDER_KEY)
    }
  } catch { /* ignore */ }
  return merged
}

function saveOrder(key: string, order: string[]) {
  try { localStorage.setItem(key, JSON.stringify(order)) } catch {}
}

/** Merge saved order with current catalog: drop unknown ids, dedupe, prepend missing ids. */
export function computeReconciledChartOrder(current: ChartId[]): ChartId[] {
  const fallback = [...CHART_DEFAULT]
  const valid = new Set(fallback)
  const seen = new Set<string>()
  const kept = current.filter((id): id is ChartId => {
    if (!valid.has(id) || seen.has(id)) return false
    seen.add(id)
    return true
  })
  const missing = fallback.filter((x) => !kept.includes(x))
  return [...missing, ...kept]
}

/**
 * Bump when chart defaults or saved layout semantics change.
 * Clears chart order keys once so new cards appear without a manual hard refresh.
 */
const DASH_SCHEMA_VERSION = '10'
const SCHEMA_KEY = 'loaniq-dash-schema'

function migrateDashboardLocalStorage() {
  if (typeof localStorage === 'undefined') return
  try {
    if (localStorage.getItem(SCHEMA_KEY) === DASH_SCHEMA_VERSION) return
    localStorage.removeItem(CHART_ORDER_KEY)
    localStorage.removeItem(LEGACY_CHART_ORDER_KEY)
    localStorage.setItem(SCHEMA_KEY, DASH_SCHEMA_VERSION)
  } catch {
    /* quota / private mode */
  }
}

migrateDashboardLocalStorage()

function referenceDate(loans: Loan[]) {
  if (!loans.length) return new Date()
  return loans[loans.length - 1]!.issuedAt
}

function windowForTimeframe(loans: Loan[], tf: Timeframe): { start: number; end: number } {
  const ref = referenceDate(loans)
  const end = ref.getTime()
  let start = loans[0]?.issuedAt.getTime() ?? 0
  if (tf === '7d') start = subDays(ref, 7).getTime()
  else if (tf === '30d') start = subDays(ref, 30).getTime()
  else if (tf === '90d') start = subDays(ref, 90).getTime()
  else if (tf === 'ytd') start = startOfYear(ref).getTime()
  return { start, end }
}

export function selectEffectiveRange(loans: Loan[], timeframe: Timeframe, brush: BrushRange) {
  const base = windowForTimeframe(loans, timeframe)
  if (!brush) return base
  return { start: Math.max(base.start, brush.start), end: Math.min(base.end, brush.end) }
}

export function filterLoans(loans: Loan[], range: { start: number; end: number }, cross: CrossFilters): Loan[] {
  const regions = cross.regions ?? []
  const purposes = cross.purposes ?? []
  const grades = cross.grades ?? []
  const regionSet = regions.length ? new Set(regions) : null
  const purposeSet = purposes.length ? new Set(purposes) : null
  const gradeSet = grades.length ? new Set(grades) : null

  return loans.filter((l) => {
    const t = l.issuedAt.getTime()
    if (t < range.start || t > range.end) return false
    if (cross.region && l.state !== cross.region) return false
    if (regionSet && !regionSet.has(l.state)) return false
    if (cross.purpose && l.purpose !== cross.purpose) return false
    if (purposeSet && !purposeSet.has(l.purpose)) return false
    if (cross.grade && l.grade !== cross.grade) return false
    if (gradeSet && !gradeSet.has(l.grade)) return false
    if (cross.monthKey) {
      const key = `${l.issuedAt.getFullYear()}-${String(l.issuedAt.getMonth() + 1).padStart(2, '0')}`
      if (key != cross.monthKey) return false
    }
    return true
  })
}

type State = {
  loans: Loan[]
  loading: boolean
  error: string | null
  timeframe: Timeframe
  brush: BrushRange
  cross: CrossFilters
  kpiOrder: KpiId[]
  chartOrder: ChartId[]
  drillLoan: Loan | null
  loadData: () => Promise<void>
  setTimeframe: (t: Timeframe) => void
  setBrush: (b: BrushRange) => void
  clearBrush: () => void
  setCross: (partial: Partial<CrossFilters>) => void
  clearCrossFilters: () => void
  setKpiOrder: (order: KpiId[]) => void
  setChartOrder: (order: ChartId[]) => void
  /** Sync chartOrder with CHART_CATALOG (fixes stale Zustand state after HMR / partial localStorage). */
  reconcileChartOrder: () => void
  openDrill: (loan: Loan) => void
  closeDrill: () => void
}

const defaultCross: CrossFilters = { region: null, regions: [], purpose: null, purposes: [], grade: null, grades: [], monthKey: null }

export const useDashboardStore = create<State>((set, get) => ({
  loans: [], loading: true, error: null,
  timeframe: 'all', brush: null, cross: { ...defaultCross },
  kpiOrder: loadOrder<KpiId>('dash-kpi-order', [...KPI_DEFAULT]),
  chartOrder: loadChartOrder(),
  drillLoan: null,
  loadData: async () => {
    set({ loading: true, error: null })
    try { const loans = await loadLcLoans(); set({ loans, loading: false }) }
    catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to load data', loading: false }) }
  },
  setTimeframe: (timeframe) => set({ timeframe, brush: null }),
  setBrush: (brush) => set({ brush }),
  clearBrush: () => set({ brush: null }),
  setCross: (partial) => set((s) => ({ cross: { ...s.cross, ...partial } })),
  clearCrossFilters: () => set({ cross: { ...defaultCross } }),
  setKpiOrder: (kpiOrder) => { saveOrder('dash-kpi-order', kpiOrder); set({ kpiOrder }) },
  setChartOrder: (chartOrder) => { saveOrder(CHART_ORDER_KEY, chartOrder); set({ chartOrder }) },
  reconcileChartOrder: () => {
    const prev = get().chartOrder
    const next = computeReconciledChartOrder(prev)
    const changed =
      prev.length !== next.length || prev.some((id, i) => id !== next[i])
    if (changed) {
      saveOrder(CHART_ORDER_KEY, next)
      set({ chartOrder: next })
    }
  },
  openDrill: (drillLoan) => set({ drillLoan }),
  closeDrill: () => set({ drillLoan: null }),
}))

export function aggregateByMonth(loans: Loan[]) {
  const map = new Map<string, { key: string; label: string; volume: number; count: number; rateSum: number }>()
  for (const l of loans) {
    const key = `${l.issuedAt.getFullYear()}-${String(l.issuedAt.getMonth() + 1).padStart(2, '0')}`
    const label = l.issuedAt.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    const cur = map.get(key) ?? { key, label, volume: 0, count: 0, rateSum: 0 }
    cur.volume += l.amount
    cur.count += 1
    cur.rateSum += l.rate
    map.set(key, cur)
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).map((row) => ({ ...row, avgRate: row.count ? row.rateSum / row.count : 0 }))
}

export function aggregateRegion(loans: Loan[]) {
  const map = new Map<string, { volume: number; count: number }>()
  for (const l of loans) {
    const cur = map.get(l.state) ?? { volume: 0, count: 0 }
    cur.volume += l.amount
    cur.count += 1
    map.set(l.state, cur)
  }
  return [...map.entries()].map(([name, v]) => ({ name, volume: v.volume, count: v.count }))
}

export function aggregatePurpose(loans: Loan[]) {
  const map = new Map<string, number>()
  for (const l of loans) map.set(l.purpose, (map.get(l.purpose) ?? 0) + 1)
  return [...map.entries()].map(([name, value]) => ({ name, value }))
}

export function aggregateGrade(loans: Loan[]) {
  const order = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const map = new Map<string, number>()
  for (const l of loans) map.set(l.grade, (map.get(l.grade) ?? 0) + 1)
  return order.map((g) => ({ grade: g, count: map.get(g) ?? 0 }))
}
