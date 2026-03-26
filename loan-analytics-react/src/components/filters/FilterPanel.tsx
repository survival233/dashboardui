import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Timeframe } from '../../store/dashboardStore'
import { useDashboardStore } from '../../store/dashboardStore'

function Toggle<T extends string>({
  layoutId,
  label,
  value,
  onChange,
  options,
}: {
  layoutId: string
  label: string
  value: T
  onChange: (v: T) => void
  options: { id: T; label: string }[]
}) {
  return (
    <div className="filter-field">
      <span className="filter-label-inline">{label}</span>
      <div className="toggle-row">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`toggle-btn${value === o.id ? ' on' : ''}`}
          >
            {value === o.id && (
              <motion.span
                layoutId={layoutId}
                className="toggle-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string
  placeholder: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [options, search])

  const toggle = useCallback((val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val],
    )
  }, [selected, onChange])

  const displayLabel = selected.length === 0
    ? placeholder
    : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} selected`

  return (
    <div ref={ref} className="multi-select-wrap filter-field">
      <span className="filter-label-inline">{label}</span>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className={selected.length ? 'multi-select-active' : ''}>{displayLabel}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div className="multi-select-dropdown">
          {options.length > 6 && (
            <input
              className="multi-select-search"
              placeholder={`Search ${label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}
          <div className="multi-select-list">
            {filtered.map((opt) => {
              const checked = selected.includes(opt)
              return (
                <label key={opt} className="multi-select-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt)}
                  />
                  <span className="multi-select-check">
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6l2.5 2.5 5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="multi-select-label">{opt}</span>
                </label>
              )
            })}
            {filtered.length === 0 && (
              <p className="multi-select-empty">No matches</p>
            )}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              className="multi-select-clear"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '7d', label: '7 d' },
  { id: '30d', label: '30 d' },
  { id: '90d', label: '90 d' },
  { id: 'ytd', label: 'YTD' },
  { id: 'all', label: 'All' },
]
export function FilterPanel() {
  const loans = useDashboardStore((s) => s.loans)
  const timeframe = useDashboardStore((s) => s.timeframe)
  const setTimeframe = useDashboardStore((s) => s.setTimeframe)
  const cross = useDashboardStore((s) => s.cross)
  const setCross = useDashboardStore((s) => s.setCross)
  const clearCrossFilters = useDashboardStore((s) => s.clearCrossFilters)
  const clearBrush = useDashboardStore((s) => s.clearBrush)
  const brush = useDashboardStore((s) => s.brush)

  const states = useMemo(() => [...new Set(loans.map((l) => l.state))].sort(), [loans])
  const purposes = useMemo(() => [...new Set(loans.map((l) => l.purpose))].sort(), [loans])
  const grades = useMemo(() => [...new Set(loans.map((l) => l.grade))].sort(), [loans])

  const regions = cross.regions ?? []
  const purposes_ = cross.purposes ?? []
  const grades_ = cross.grades ?? []

  const chips: { label: string; clear: () => void }[] = []
  if (cross.region) chips.push({ label: `State: ${cross.region}`, clear: () => setCross({ region: null }) })
  if (regions.length) chips.push({ label: `States: ${regions.join(', ')}`, clear: () => setCross({ regions: [] }) })
  if (cross.purpose) chips.push({ label: `Purpose: ${cross.purpose}`, clear: () => setCross({ purpose: null }) })
  if (purposes_.length) chips.push({ label: `Purposes: ${purposes_.join(', ')}`, clear: () => setCross({ purposes: [] }) })
  if (cross.grade) chips.push({ label: `Grade: ${cross.grade}`, clear: () => setCross({ grade: null }) })
  if (grades_.length) chips.push({ label: `Grades: ${grades_.join(', ')}`, clear: () => setCross({ grades: [] }) })
  if (cross.monthKey) chips.push({ label: `Month: ${cross.monthKey}`, clear: () => setCross({ monthKey: null }) })
  if (brush) chips.push({ label: 'Brush range', clear: clearBrush })

  return (
    <section className="filter-bar">
      <div className="filter-bar-header">
        <h3>Scope & filters</h3>
        <p>One scope for all charts.</p>
      </div>

      <div className="filter-bar-body">
        <div className="filter-bar-toggles">
          <Toggle layoutId="t-time" label="Time range" value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} />
        </div>

        <div className="filter-bar-dropdowns">
          <MultiSelect
            label="State"
            placeholder="All states"
            options={states}
            selected={regions}
            onChange={(r) => setCross({ regions: r, region: null })}
          />
          <MultiSelect
            label="Purpose"
            placeholder="All purposes"
            options={purposes}
            selected={purposes_}
            onChange={(p) => setCross({ purposes: p, purpose: null })}
          />
          <MultiSelect
            label="Grade"
            placeholder="All grades"
            options={grades}
            selected={grades_}
            onChange={(g) => setCross({ grades: g, grade: null })}
          />
        </div>

        {chips.length > 0 && (
          <div className="filter-bar-chips">
            <div className="chip-row">
              {chips.map((c) => (
                <span key={c.label} className="chip">
                  {c.label}
                  <button type="button" onClick={c.clear} aria-label={`Remove ${c.label}`}>×</button>
                </span>
              ))}
            </div>
            <button
              type="button"
              className="reset-btn primary"
              onClick={() => { clearCrossFilters(); clearBrush() }}
            >
              Reset all
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
