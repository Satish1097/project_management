import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import {
  sprintBoardPath,
  sprintDetailPath,
  projectBacklogSprintPath,
} from '@/constants/routes'
import type { Sprint } from '@/types/sprints'
import { cn } from '@/utils/cn'

type PlanningSprintMenuProps = {
  sprint: Sprint
  projectId: string
  className?: string
}

export function PlanningSprintMenu({
  sprint,
  projectId,
  className,
}: PlanningSprintMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label="Sprint actions"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded p-1 text-devflow-text-muted hover:bg-devflow-muted hover:text-devflow-text"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-md border border-devflow-border bg-devflow-surface py-1 shadow-devflow-md"
        >
          <Link
            role="menuitem"
            to={sprintDetailPath(projectId, sprint.id)}
            className="block px-3 py-1.5 text-[13px] text-devflow-text hover:bg-devflow-muted"
            onClick={() => setOpen(false)}
          >
            View sprint
          </Link>
          <Link
            role="menuitem"
            to={sprintBoardPath(projectId, sprint.id)}
            className="block px-3 py-1.5 text-[13px] text-devflow-text hover:bg-devflow-muted"
            onClick={() => setOpen(false)}
          >
            Open board
          </Link>
          <Link
            role="menuitem"
            to={projectBacklogSprintPath(projectId, sprint.id)}
            className="block px-3 py-1.5 text-[13px] text-devflow-text hover:bg-devflow-muted"
            onClick={() => setOpen(false)}
          >
            Plan in backlog
          </Link>
        </div>
      ) : null}
    </div>
  )
}
