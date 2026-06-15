import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/features/theme/ThemeProvider'
import { cn } from '@/utils/cn'

type ThemeToggleProps = {
  className?: string
  /** Compact icon-only control for dense headers */
  variant?: 'icon' | 'pill'
}

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-devflow-border bg-devflow-muted px-2.5 py-1.5 text-caption text-devflow-text-secondary transition-colors hover:bg-devflow-subtle',
          className,
        )}
      >
        {isDark ? (
          <Sun className="size-3.5 shrink-0" strokeWidth={2} />
        ) : (
          <Moon className="size-3.5 shrink-0" strokeWidth={2} />
        )}
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-8 items-center justify-center rounded-lg text-devflow-icon-muted transition-colors hover:bg-devflow-hover-overlay',
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-[18px]" strokeWidth={1.75} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={1.75} />
      )}
    </button>
  )
}
