import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { KpiId } from '../../store/dashboardStore'
import { useDashboardStore } from '../../store/dashboardStore'
import { useFilteredLoans } from '../../hooks/useFilteredLoans'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/cn'

function useKpiMetrics(loans: ReturnType<typeof useFilteredLoans>) {
  return useMemo(() => {
    const count = loans.length
    const volume = loans.reduce((a, l) => a + l.amount, 0)
    const avgRate = count ? loans.reduce((a, l) => a + l.rate, 0) / count : 0
    const chargedOff = loans.filter((l) => l.loanStatus === 'Charged Off').length
    const dqRate = count ? (chargedOff / count) * 100 : 0
    const avgReturn = count ? loans.reduce((a, l) => a + l.expectedReturn, 0) / count : 0
    return { count, volume, avgRate, dqRate, avgReturn }
  }, [loans])
}

const KPI_META: Record<KpiId, { title: string; changeLabel: string; positive: boolean }> = {
  originations: { title: 'Total borrowers', changeLabel: 'active portfolio', positive: true },
  volume: { title: 'Funded volume', changeLabel: 'total disbursed', positive: true },
  avgRate: { title: 'Portfolio APR', changeLabel: 'weighted avg', positive: false },
  dqRate: { title: 'Expected return', changeLabel: 'avg across loans', positive: true },
}

function KpiCard({ id, value, metrics, loading }: { id: KpiId; value: string; metrics: ReturnType<typeof useKpiMetrics>; loading: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const meta = KPI_META[id]

  const changeValue = useMemo(() => {
    if (loading || !metrics.count) return null
    switch (id) {
      case 'originations': return { pct: metrics.dqRate, label: `${metrics.dqRate.toFixed(1)}% charged off`, positive: false }
      case 'volume': return { pct: 0, label: `${formatCurrency(metrics.volume / metrics.count)} avg`, positive: true }
      case 'avgRate': return { pct: 0, label: `${metrics.count.toLocaleString()} loans`, positive: true }
      case 'dqRate': return { pct: metrics.avgReturn * 100, label: `${(metrics.avgReturn * 100).toFixed(2)}% return`, positive: metrics.avgReturn > 0 }
      default: return null
    }
  }, [id, loading, metrics])

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'kpi-tile group relative',
        isDragging && 'z-10 opacity-90',
      )}
    >
      <button
        type="button"
        className="absolute -right-1 -top-1 rounded p-1 text-[var(--text-muted)] opacity-0 transition hover:text-[var(--text-secondary)] group-hover:opacity-100"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <p className="text-[0.72rem] font-medium text-[var(--text-muted)]">{meta.title}</p>

      <motion.p
        key={value + String(loading)}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: loading ? 0.2 : 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-1 text-[1.85rem] font-semibold tracking-tight tabular-nums text-[var(--text)]"
        style={{ lineHeight: 1.15 }}
      >
        {loading ? '—' : value}
      </motion.p>

      {changeValue && !loading && (
        <p className="mt-1.5 text-[0.72rem] text-[var(--text-muted)]">
          <span className={cn(
            'font-semibold',
            changeValue.positive ? 'text-[var(--positive)]' : 'text-[var(--negative)]',
          )}>
            {meta.changeLabel === 'active portfolio'
              ? `${changeValue.label}`
              : changeValue.label}
          </span>
        </p>
      )}
    </div>
  )
}

export function KpiStrip({ loading }: { loading: boolean }) {
  const loans = useFilteredLoans()
  const kpiOrder = useDashboardStore((s) => s.kpiOrder)
  const setKpiOrder = useDashboardStore((s) => s.setKpiOrder)
  const metrics = useKpiMetrics(loans)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldI = kpiOrder.indexOf(active.id as KpiId)
    const newI = kpiOrder.indexOf(over.id as KpiId)
    if (oldI < 0 || newI < 0) return
    const next = [...kpiOrder]
    const [moved] = next.splice(oldI, 1)
    next.splice(newI, 0, moved!)
    setKpiOrder(next)
  }

  const cardValue = (id: KpiId): string => {
    if (loading) return ''
    switch (id) {
      case 'originations': return metrics.count.toLocaleString()
      case 'volume': return formatCurrency(metrics.volume)
      case 'avgRate': return `${metrics.avgRate.toFixed(2)}%`
      case 'dqRate': return `${(metrics.avgReturn * 100).toFixed(2)}%`
      default: return ''
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={kpiOrder} strategy={rectSortingStrategy}>
        <div className="kpi-grid">
          {kpiOrder.map((id) => (
            <KpiCard key={id} id={id} value={cardValue(id)} metrics={metrics} loading={loading} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
