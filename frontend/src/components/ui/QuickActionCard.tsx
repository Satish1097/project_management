import type { LucideIcon } from 'lucide-react'

type QuickActionCardProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
}: QuickActionCardProps) {
  return (
    <article className="flex flex-col gap-1 rounded-lg border border-devflow-border bg-devflow-muted p-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-devflow-subtle text-devflow-text-secondary">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <h4 className="pt-0.5 text-card-title text-devflow-text">
        {title}
      </h4>
      <p className="text-caption text-devflow-text-secondary">{description}</p>
    </article>
  )
}
