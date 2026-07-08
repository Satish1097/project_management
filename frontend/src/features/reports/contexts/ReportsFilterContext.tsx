import { createContext, useContext, useState, type ReactNode } from 'react'

type ReportsFilterContextValue = {
  selectedSprintId: string | null
  setSelectedSprintId: (id: string | null) => void
  metricType: 'points' | 'count'
  setMetricType: (type: 'points' | 'count') => void
}

const ReportsFilterContext = createContext<ReportsFilterContextValue | null>(null)

export function ReportsFilterProvider({ children }: { children: ReactNode }) {
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [metricType, setMetricType] = useState<'points' | 'count'>('points')

  return (
    <ReportsFilterContext.Provider
      value={{
        selectedSprintId,
        setSelectedSprintId,
        metricType,
        setMetricType,
      }}
    >
      {children}
    </ReportsFilterContext.Provider>
  )
}

export function useReportsFilter(): ReportsFilterContextValue {
  const context = useContext(ReportsFilterContext)
  if (!context) {
    throw new Error('useReportsFilter must be used within a ReportsFilterProvider')
  }
  return context
}
