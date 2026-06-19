type IssueListPaginationProps = {
  page: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
}

export function IssueListPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
}: IssueListPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-center gap-4">
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
  )
}
