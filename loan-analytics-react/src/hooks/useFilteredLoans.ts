import { useMemo } from 'react'
import {
  filterLoans,
  selectEffectiveRange,
  useDashboardStore,
} from '../store/dashboardStore'

export function useFilteredLoans() {
  const loans = useDashboardStore((s) => s.loans)
  const timeframe = useDashboardStore((s) => s.timeframe)
  const brush = useDashboardStore((s) => s.brush)
  const cross = useDashboardStore((s) => s.cross)

  return useMemo(() => {
    const range = selectEffectiveRange(loans, timeframe, brush)
    return filterLoans(loans, range, cross)
  }, [loans, timeframe, brush, cross])
}
