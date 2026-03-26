import type { DashboardConfig, DatasetSchema, FieldMeta, GenericRow } from './types'

function looksLikeDate(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime())
  if (typeof value !== 'string') return false
  const t = Date.parse(value)
  return !Number.isNaN(t)
}

export function detectSchema(rows: GenericRow[]): DatasetSchema {
  const keys = new Set<string>()
  rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)))

  const fields: FieldMeta[] = [...keys].map((key) => {
    const vals = rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== '')
    const nonNullCount = vals.length
    const uniqueCount = new Set(vals.map((v) => String(v))).size

    let kind: FieldMeta['kind'] = 'other'
    if (!vals.length) kind = 'other'
    else if (vals.every((v) => typeof v === 'number' && Number.isFinite(v))) kind = 'number'
    else if (vals.every((v) => typeof v === 'boolean')) kind = 'boolean'
    else if (vals.filter(looksLikeDate).length / vals.length >= 0.8) kind = 'date'
    else if (vals.every((v) => typeof v === 'string') && uniqueCount <= Math.max(60, Math.floor(vals.length * 0.4))) kind = 'category'

    return { key, kind, nonNullCount, uniqueCount }
  })

  return {
    fields,
    numericFields: fields.filter((f) => f.kind === 'number').map((f) => f.key),
    dateFields: fields.filter((f) => f.kind === 'date').map((f) => f.key),
    categoryFields: fields.filter((f) => f.kind === 'category').map((f) => f.key),
    booleanFields: fields.filter((f) => f.kind === 'boolean').map((f) => f.key),
  }
}

function toLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

export function buildDefaultConfig(schema: DatasetSchema): DashboardConfig {
  const metricField = schema.numericFields[0] ?? ''
  const dateField = schema.dateFields[0]
  const secondaryMetricField = schema.numericFields.find((f) => f !== metricField)
  const categoryFields = schema.categoryFields.slice(0, 4)
  const labels: Record<string, string> = {}
  schema.fields.forEach((f) => { labels[f.key] = toLabel(f.key) })
  return { dateField, metricField, secondaryMetricField, categoryFields, labels }
}
