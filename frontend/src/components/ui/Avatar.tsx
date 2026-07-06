import { cn } from '@/utils/cn'

type AvatarProps = {
  name: string
  color: string
  size?: number
  className?: string
  showTooltip?: boolean
}

export function Avatar({ name, color, size = 24, className, showTooltip = true }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-caption font-bold text-white',
        className,
      )}
      style={{ width: size, height: size, backgroundColor: color }}
      title={showTooltip ? name : undefined}
    >
      {initials}
    </div>
  )
}
