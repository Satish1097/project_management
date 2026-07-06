import { cn } from '@/utils/cn'

/** Minimum width before horizontal scroll kicks in (checkbox → actions). */
export const BACKLOG_TABLE_MIN_WIDTH = '68rem'

/**
 * Checkbox · drag · key (88px) · summary (flex) · assignee (120px) ·
 * sprint (130px) · priority (100px) · labels (flex) · actions
 */
export const BACKLOG_ROW_GRID = cn(
  'grid items-center gap-x-1.5',
  'grid-cols-[1.75rem_1.25rem_5.5rem_minmax(0,1fr)_7.5rem_8.125rem_6.25rem_minmax(4rem,1fr)_1.75rem]',
)

export const BACKLOG_ROW_PADDING = 'px-2 py-1'

/** Fixed-height inline field — hover/focus without layout shift. */
export const INLINE_CELL_TRIGGER = cn(
  'flex h-6 w-full min-w-0 items-center rounded border border-transparent px-1',
  'text-[12px] leading-tight text-devflow-text-secondary transition-colors',
  'hover:border-devflow-border/60 hover:bg-devflow-muted/40',
  'focus-visible:border-devflow-primary/50 focus-visible:bg-devflow-muted/50 focus-visible:outline-none',
)

export const BACKLOG_TABLE_SHELL = cn(
  'overflow-hidden rounded-md border border-devflow-border/80 bg-devflow-card',
)

export const BACKLOG_TABLE_SCROLL = cn(
  'overflow-x-auto overflow-y-auto',
  'max-h-[calc(100vh-12rem)]',
)

export const BACKLOG_STICKY_HEADER = cn(
  'sticky top-0 z-10 border-b border-devflow-border bg-devflow-table-header',
  'text-[10px] font-semibold uppercase tracking-wider text-devflow-text-muted',
)

export const BACKLOG_TOOLBAR = cn(
  'sticky top-0 z-20 -mx-1 space-y-2 bg-devflow-background/95 px-1 pb-2 pt-0 backdrop-blur-sm',
)
