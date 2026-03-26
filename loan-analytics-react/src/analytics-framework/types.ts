export type GenericRow = Record<string, unknown>

export type FieldKind = 'number' | 'date' | 'category' | 'boolean' | 'other'

export type FieldMeta = {
  key: string
  kind: FieldKind
  nonNullCount: number
  uniqueCount: number
}

export type DatasetSchema = {
  fields: FieldMeta[]
  numericFields: string[]
  dateFields: string[]
  categoryFields: string[]
  booleanFields: string[]
}

export type DashboardConfig = {
  dateField?: string
  metricField: string
  secondaryMetricField?: string
  categoryFields: string[]
  labels: Record<string, string>
}

export type KpiItem = {
  id: string
  label: string
  value: string
  delta?: string
}
