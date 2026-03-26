import { Component, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { KpiStrip } from './components/kpi/KpiStrip'
import { RegionCard } from './components/charts/RegionCard'
import { TreemapCard } from './components/charts/TreemapCard'
import { GradeRiskReturnComboCard } from './components/charts/GradeRiskReturnComboCard'
import { SegmentDefaultRatesBarCard } from './components/charts/SegmentDefaultRatesBarCard'
import { RiskPricingCalibrationCard } from './components/charts/RiskPricingCalibrationCard'
import { DefaultLossImpactCard } from './components/charts/DefaultLossImpactCard'
import { VintagePerformanceCard } from './components/charts/VintagePerformanceCard'
import { LoanSizeDistributionCard } from './components/charts/LoanSizeDistributionCard'
import { BorrowerLeverageCard } from './components/charts/BorrowerLeverageCard'
import { FilterPanel } from './components/filters/FilterPanel'
import { DrillPanel } from './components/drill/DrillPanel'
import { useDashboardStore, type ChartId } from './store/dashboardStore'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

class AppErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: unknown) {
    if (error instanceof Error) return { message: error.message }
    return { message: String(error) }
  }

  render() {
    if (this.state.message) {
      return <div className="alert">Dashboard crashed: {this.state.message}</div>
    }
    return this.props.children
  }
}

function ChartWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="card">
      <div className="card-head"><h3>{title}</h3><p>{subtitle}</p></div>
      <div className="chart-plot-body">{children}</div>
    </section>
  )
}

function SortableChart({ id, children }: { id: ChartId; children: ReactNode }) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.85 : undefined,
      }}
      className="chart-card"
      data-chart-id={id}
    >
      <button type="button" className="drag-handle" aria-label="Drag card" {...attributes} {...listeners}>⋮⋮</button>
      {children}
    </div>
  )
}

function App() {
  const loadData = useDashboardStore((s) => s.loadData)
  const loading = useDashboardStore((s) => s.loading)
  const error = useDashboardStore((s) => s.error)
  const chartOrder = useDashboardStore((s) => s.chartOrder)
  const setChartOrder = useDashboardStore((s) => s.setChartOrder)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'risk' | 'origination'>('portfolio')

  useEffect(() => { void loadData() }, [loadData])

  useLayoutEffect(() => {
    useDashboardStore.getState().reconcileChartOrder()
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = chartOrder.indexOf(active.id as ChartId)
    const newIndex = chartOrder.indexOf(over.id as ChartId)
    if (oldIndex < 0 || newIndex < 0) return
    setChartOrder(arrayMove(chartOrder, oldIndex, newIndex))
  }

  const chartMap: Record<ChartId, ReactNode> = {
    region: (
      <ChartWrapper title="Top states by volume" subtitle="Funded loans by region">
        <RegionCard loading={loading} />
      </ChartWrapper>
    ),
    treemap: (
      <ChartWrapper
        title="Loan purpose treemap"
        subtitle="Loan count (size) + volume (color)"
      >
        <TreemapCard loading={loading} />
      </ChartWrapper>
    ),
    gradeRiskReturn: (
      <ChartWrapper
        title="Risk vs return by grade"
        subtitle="Bars: risk-adjusted. Lines: return% + default%"
      >
        <GradeRiskReturnComboCard loading={loading} />
      </ChartWrapper>
    ),
    segmentDefaultRates: (
      <ChartWrapper
        title="Default rates by borrower segment"
        subtitle="Default% by segment (avg x=4.8)"
      >
        <SegmentDefaultRatesBarCard loading={loading} />
      </ChartWrapper>
    ),
    defaultLossImpact: (
      <ChartWrapper
        title="How much do we lose when loans default?"
        subtitle="Exposure vs estimated loss by grade"
      >
        <DefaultLossImpactCard loading={loading} />
      </ChartWrapper>
    ),
  }

  return (
    <AppErrorBoundary>
      <div className="shell">
        <main className="main">
          <header className="topbar">
            <div className="topbar-brand">LoanIQ</div>
            <div className="topbar-actions">
              <button className="icon-btn" aria-label="Notifications">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              </button>
              <div className="avatar" title="Analyst profile">EB</div>
            </div>
          </header>

          {error && <div className="alert">{error}</div>}

          <div className="overview">
            <div className="overview-stack">
              <section className="overview-panel overview-panel--controls" aria-label="Filters and scope">
                <FilterPanel />
              </section>

              <section className="overview-panel overview-panel--metrics" aria-label="Key metrics">
                <KpiStrip loading={loading} />
              </section>

              <section className="overview-visuals" aria-labelledby="overview-charts-heading">
                <div className="overview-visuals-head">
                  <div>
                    <h2 id="overview-charts-heading" className="overview-section-title">
                      Portfolio analytics
                    </h2>
                    <p className="overview-panel-desc overview-panel-desc--single">
                      Drag cards to reorder. Click bars, points, or map regions to cross-filter.
                    </p>
                  </div>
                  <div className="chart-tabs" role="tablist" aria-label="Analytics tabs">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'portfolio'}
                      className={`chart-tab ${activeTab === 'portfolio' ? 'chart-tab--active' : ''}`}
                      onClick={() => setActiveTab('portfolio')}
                    >
                      Portfolio Concentration
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'risk'}
                      className={`chart-tab ${activeTab === 'risk' ? 'chart-tab--active' : ''}`}
                      onClick={() => setActiveTab('risk')}
                    >
                      Credit Risk & Loss Analytics
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'origination'}
                      className={`chart-tab ${activeTab === 'origination' ? 'chart-tab--active' : ''}`}
                      onClick={() => setActiveTab('origination')}
                    >
                      Borrower Profile & Exposure Mix
                    </button>
                  </div>
                </div>
                {activeTab === 'portfolio' ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
                      <div className="charts charts--overview">
                        {chartOrder.map((id) => (
                          <SortableChart key={id} id={id}>{chartMap[id]}</SortableChart>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : activeTab === 'risk' ? (
                  <div className="charts charts--overview charts--risk">
                    <div className="chart-card chart-card--risk">
                      <ChartWrapper title="Are we pricing risk correctly?" subtitle="APR vs defaults by grade (excess spread)">
                        <RiskPricingCalibrationCard loading={loading} />
                      </ChartWrapper>
                    </div>
                    <div className="chart-card chart-card--risk">
                      <ChartWrapper title="How are recent loan vintages performing?" subtitle="Expected return and default rate by issue quarter">
                        <VintagePerformanceCard loading={loading} />
                      </ChartWrapper>
                    </div>
                  </div>
                ) : (
                  <div className="charts charts--overview charts--origination">
                    <div className="chart-card chart-card--risk">
                      <ChartWrapper title="What's our loan size distribution?" subtitle="Loan amount buckets split by grade">
                        <LoanSizeDistributionCard loading={loading} />
                      </ChartWrapper>
                    </div>
                    <div className="chart-card chart-card--risk">
                      <ChartWrapper title="Are borrowers over-leveraged?" subtitle="Installment-to-monthly-income leverage bands">
                        <BorrowerLeverageCard loading={loading} />
                      </ChartWrapper>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>

        <DrillPanel />
      </div>
    </AppErrorBoundary>
  )
}

export default App
