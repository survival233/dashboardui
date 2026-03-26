export const axisMuted = '#9CA3AF'
export const gridLine = '#F1F5F9'
export const primary = '#6366F1'
export const primarySoft = '#818CF8'

/** Axis title (Recharts `label.style`) — use across all charts */
export const axisLabelStyle = { fontSize: 11, fill: axisMuted, fontWeight: 500 } as const

/** Default ticks for numeric / continuous axes */
export const axisTickDefault = { fill: axisMuted, fontSize: 10 }

/** Short categorical ticks (e.g. credit grade) */
export const axisTickCategory = { fill: axisMuted, fontSize: 12, fontWeight: 600 }

/** Categorical ticks when labels are longer (states, purposes, employment) */
export const axisTickCategoryDense = { fill: axisMuted, fontSize: 11, fontWeight: 600 }

/** Standard chart margins (vertical bar / line / composed) — left room for horizontal Y-axis titles */
export const chartMarginDefault = { top: 28, right: 16, left: 52, bottom: 32 } as const

/** Many horizontal X-axis tick labels need extra bottom space (no rotation) */
export const chartMarginDenseX = { ...chartMarginDefault, bottom: 44 } as const

/** @deprecated use chartMarginDenseX — kept for any stale imports */
export const chartMarginRotatedX = chartMarginDenseX

/** Horizontal bars (`layout="vertical"`) */
export const chartMarginVerticalBar = { top: 16, right: 20, left: 8, bottom: 16 } as const

export function axisLabelBottom(value: string, offset = 0) {
  return { value, position: 'bottom' as const, offset, style: { ...axisLabelStyle } }
}

/** Horizontal Y-axis title (readable left of the plot; requires margin.left in chartMarginDefault) */
export function axisLabelLeft(value: string, offset = 4) {
  return { value, angle: 0 as const, position: 'left' as const, offset, style: { ...axisLabelStyle } }
}

export function axisLabelRight(value: string, offset = 4) {
  return { value, angle: 0 as const, position: 'right' as const, offset, style: { ...axisLabelStyle } }
}

/** Vertical Y-axis title (classic style along the axis) — use with adequate margin.left */
export function axisLabelLeftVertical(value: string, offset = 12) {
  return { value, angle: -90 as const, position: 'left' as const, offset, style: { ...axisLabelStyle } }
}

/** Vertical Y-axis title on the right side (dual-axis charts) — use with adequate margin.right */
export function axisLabelRightVertical(value: string, offset = 12) {
  return { value, angle: 90 as const, position: 'right' as const, offset, style: { ...axisLabelStyle } }
}

export const palette = [
  '#6366F1', // indigo
  '#3B82F6', // blue
  '#14B8A6', // teal
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F59E0B', // amber
  '#64748B', // slate
]

type AdaptiveYAxisOptions = {
  minTicks?: number
  maxTicks?: number
  minPxPerTick?: number
  minWidth?: number
  maxWidth?: number
  tickMargin?: number
  withAxisLabel?: boolean
}

type AxisBottomSpacingOptions = {
  hasXAxisLabel?: boolean
  hasLegend?: boolean
  denseTicks?: boolean
  extraBottom?: number
  legendPaddingTop?: number
}

/**
 * Reusable axis layout helper to prevent Y-tick overlap across charts.
 * Uses available plot height to derive a safe tick count + axis width.
 */
export function adaptiveYAxisLayout(plotHeight: number, options: AdaptiveYAxisOptions = {}) {
  const {
    minTicks = 3,
    maxTicks = 6,
    minPxPerTick = 42,
    minWidth = 46,
    maxWidth = 64,
    tickMargin = 8,
    withAxisLabel = true,
  } = options

  const safeHeight = Math.max(120, Math.round(plotHeight || 0))
  const tickCount = Math.max(minTicks, Math.min(maxTicks, Math.floor(safeHeight / minPxPerTick)))
  const baseWidth = Math.max(minWidth, Math.min(maxWidth, 40 + tickCount * 2))
  const width = withAxisLabel ? baseWidth + 8 : baseWidth
  const labelOffset = withAxisLabel ? Math.max(12, Math.min(22, Math.round(width * 0.28))) : 0

  return {
    tickCount,
    width,
    labelOffset,
    tickMargin,
    tick: { ...axisTickDefault, fontSize: safeHeight < 220 ? 9 : axisTickDefault.fontSize },
  } as const
}

/**
 * Reusable bottom spacing helper to avoid overlap between:
 * - X-axis tick labels
 * - X-axis title
 * - Legend items rendered near the bottom
 */
export function axisBottomSpacing(options: AxisBottomSpacingOptions = {}) {
  const {
    hasXAxisLabel = true,
    hasLegend = false,
    denseTicks = false,
    extraBottom = 0,
    legendPaddingTop = 8,
  } = options

  const tickBand = denseTicks ? 24 : 20
  const labelBand = hasXAxisLabel ? 14 : 0
  const legendBand = hasLegend ? 30 + legendPaddingTop : 0
  const xAxisHeight = tickBand + labelBand
  const bottomMargin = xAxisHeight + legendBand + extraBottom

  return {
    xAxisHeight,
    bottomMargin,
    legendPaddingTop,
  } as const
}
