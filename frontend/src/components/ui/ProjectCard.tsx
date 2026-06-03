import { AlertTriangle, Circle, Globe, Server, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge'
import { ROUTES } from '@/constants/routes'
import type { Project } from '@/types/projects'
import { cn } from '@/utils/cn'

const icons = {
  mobile: Smartphone,
  web: Globe,
  api: Server,
} as const

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const Icon = icons[project.icon]

  return (
    <Link
      to={ROUTES.board}
      className="flex flex-col gap-1 rounded-lg border border-devflow-border bg-white p-3 transition-shadow hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(208,225,251,0.5)] text-devflow-primary">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <h3 className="pt-1 text-section-title text-devflow-text">
        {project.name}
      </h3>
      <p className="line-clamp-2 pb-3 text-body text-devflow-text-secondary">
        {project.description}
      </p>

      <div className="flex items-center justify-between border-t border-[rgba(194,198,214,0.5)] pt-[17px]">
        <div className="flex items-center gap-1">
          {project.issuesCritical ? (
            <AlertTriangle className="size-3 text-[#ba1a1a]" />
          ) : (
            <Circle className="size-2.5 fill-devflow-text-secondary text-devflow-text-secondary" />
          )}
          <span
            className={cn(
              'font-mono text-caption font-medium tracking-[0.24px]',
              project.issuesCritical
                ? 'text-[#ba1a1a]'
                : 'text-devflow-text-secondary',
            )}
          >
            {project.issuesLabel}
          </span>
        </div>
        <AvatarGroup
          members={project.members}
          extra={project.extraMembers}
        />
      </div>
    </Link>
  )
}
