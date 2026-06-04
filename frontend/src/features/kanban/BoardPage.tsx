import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { TopHeader } from '@/components/layout/TopHeader'
import { kanbanColumns } from '@/services/mockKanban'
import { BoardFilters } from './BoardFilters'
import { KanbanColumn } from './KanbanColumn'

export function BoardPage() {
  return (
    <>
      <TopHeader variant="board" activeTab="Board" />
      <div className="flex items-center justify-end gap-3 border-b border-devflow-border bg-devflow-card px-4 py-2">
        <Link
          to={ROUTES.advancedBoard}
          className="text-btn text-devflow-primary hover:underline"
        >
          Advanced board
        </Link>
      </div>
      <BoardFilters />
      <main className="relative flex-1 p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {kanbanColumns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>

        <button
          type="button"
          className="fixed bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-devflow-primary text-white shadow-devflow-lg"
          aria-label="Quick add"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </main>
    </>
  )
}
