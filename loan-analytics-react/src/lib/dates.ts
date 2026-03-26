import { endOfMonth } from 'date-fns'

export function parseMonthKey(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y!, m! - 1, 1)
}

export function monthRangeMs(key: string) {
  const start = parseMonthKey(key)
  return { start: start.getTime(), end: endOfMonth(start).getTime() }
}
