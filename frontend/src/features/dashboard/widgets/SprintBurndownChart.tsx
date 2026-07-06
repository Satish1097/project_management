type SprintBurndownChartProps = {
  startDate: string | null
  endDate: string | null
  totalIssues: number
  completedIssues: number
  progressPercent: number
}

function buildBurndownPoints({
  startDate,
  endDate,
  totalIssues,
  progressPercent,
}: SprintBurndownChartProps): {
  ideal: string
  actual: string
} {
  const width = 100
  const height = 40
  const padding = 2

  const start = startDate ? new Date(startDate).getTime() : Date.now()
  const end = endDate ? new Date(endDate).getTime() : start + 14 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const totalMs = Math.max(end - start, 1)
  const elapsedRatio = Math.min(1, Math.max(0, (now - start) / totalMs))

  const idealY = (ratio: number) =>
    padding + (height - padding * 2) * ratio

  const idealStart = idealY(0)
  const idealEnd = idealY(1)
  const ideal = `M ${padding} ${idealStart} L ${width - padding} ${idealEnd}`

  const actualRemainingRatio =
    totalIssues > 0 ? 1 - progressPercent / 100 : 1 - elapsedRatio
  const actualY = idealY(actualRemainingRatio)
  const actualMidY = idealY(1 - (progressPercent / 100) * 0.5)
  const actual = `M ${padding} ${idealStart} Q ${width * 0.45} ${actualMidY} ${width - padding} ${actualY}`

  return { ideal, actual }
}

export function SprintBurndownChart(props: SprintBurndownChartProps) {
  const { ideal, actual } = buildBurndownPoints(props)

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-caption text-devflow-text-muted">
        <span>Burndown</span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 rounded bg-devflow-text-muted/50" />
            Ideal
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 rounded bg-devflow-primary" />
            Actual
          </span>
        </span>
      </div>
      <svg
        viewBox="0 0 100 40"
        className="h-10 w-full rounded-md bg-[var(--df-chart-placeholder)]"
        preserveAspectRatio="none"
        role="img"
        aria-label="Sprint burndown chart"
      >
        <path
          d={ideal}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-devflow-text-muted/40"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={actual}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-devflow-primary"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
