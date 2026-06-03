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
    <article className="flex flex-col gap-1 rounded-lg border border-devflow-border bg-[#f2f4f6] p-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-[#e0e3e5] text-[#424753]">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <h4 className="pt-0.5 text-card-title text-devflow-text">
        {title}
      </h4>
      <p className="text-caption text-[#424753]">{description}</p>
    </article>
  )
}
