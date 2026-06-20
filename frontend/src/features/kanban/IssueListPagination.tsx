type IssueListPaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
}

export function IssueListPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
}: IssueListPaginationProps) {
  if (totalCount === 0) return null

  const rangeStart = (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex flex-col items-center gap-3 border-t border-devflow-border bg-devflow-card px-4 py-3 sm:flex-row sm:justify-between">
      <p className="text-caption text-devflow-text-secondary">
        Showing {rangeStart}-{rangeEnd} of {totalCount} issues
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md px-2 py-1 text-caption text-devflow-primary transition-colors hover:text-devflow-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-devflow-primary/40 disabled:cursor-not-allowed disabled:text-devflow-text-muted"
        >
          Previous
        </button>
        <span className="text-caption text-devflow-text-secondary">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md px-2 py-1 text-caption text-devflow-primary transition-colors hover:text-devflow-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-devflow-primary/40 disabled:cursor-not-allowed disabled:text-devflow-text-muted"
        >
          Next
        </button>
      </div>
    </div>
  )
}
