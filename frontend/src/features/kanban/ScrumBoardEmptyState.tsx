import { Link } from 'react-router-dom'
import { projectSprintsPath } from '@/constants/routes'

type ScrumBoardEmptyStateProps = {
  projectId: string
}

export function ScrumBoardEmptyState({ projectId }: ScrumBoardEmptyStateProps) {
  return (
    <div className="issue-board-empty">
      <p className="issue-board-empty__title">No active sprint</p>
      <p className="issue-board-empty__hint">
        The board shows issues from the active sprint. Start a planned sprint to begin
        tracking work here.
      </p>
      <Link
        to={projectSprintsPath(projectId)}
        className="mt-4 inline-flex rounded-lg bg-devflow-primary px-4 py-2 text-btn font-medium text-white hover:bg-devflow-primary/90"
      >
        Go to Sprints
      </Link>
    </div>
  )
}
