import { Box, Plus, Rocket } from 'lucide-react'

export function EmptyStateIllustration() {
  return (
    <div className="relative mx-auto size-48">
      <div
        className="absolute -inset-8 rounded-full bg-[var(--df-illustration-glow)] blur-2xl"
        aria-hidden
      />
      <div className="relative flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-[var(--df-illustration-from)] via-[var(--df-illustration-via)] to-[var(--df-illustration-to)] opacity-90 shadow-inner">
        <div className="grid grid-cols-2 gap-2 p-5">
          <div className="h-10 w-10 rounded-lg bg-devflow-primary/20 shadow-sm" />
          <div className="mt-4 h-12 w-10 rounded-lg bg-devflow-primary/30 shadow-md" />
          <div className="col-span-2 mx-auto h-8 w-24 rounded-lg bg-devflow-brand-deep/25 shadow-lg" />
        </div>
      </div>
      <div className="absolute -right-3 -top-3 flex size-9 items-center justify-center rounded-lg bg-devflow-card shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Plus className="size-[18px] text-devflow-primary" strokeWidth={2.5} />
      </div>
      <div className="absolute -left-5 bottom-5 flex size-8 items-center justify-center rounded-lg bg-devflow-nav-active shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Rocket className="size-3 text-devflow-brand" />
      </div>
      <Box
        className="absolute bottom-8 right-5 size-6 text-devflow-primary/20"
        aria-hidden
      />
    </div>
  )
}
