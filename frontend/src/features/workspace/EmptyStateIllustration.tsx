import { Box, Plus, Rocket } from 'lucide-react'

export function EmptyStateIllustration() {
  return (
    <div className="relative mx-auto size-48">
      <div
        className="absolute -inset-8 rounded-full bg-[rgba(0,65,145,0.05)] blur-2xl"
        aria-hidden
      />
      <div className="relative flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-[#d4e3ff] via-[#e8f0ff] to-[#f7f9fb] opacity-90 shadow-inner">
        <div className="grid grid-cols-2 gap-2 p-5">
          <div className="h-10 w-10 rounded-lg bg-[#0058be]/20 shadow-sm" />
          <div className="mt-4 h-12 w-10 rounded-lg bg-[#0058be]/30 shadow-md" />
          <div className="col-span-2 mx-auto h-8 w-24 rounded-lg bg-[#004191]/25 shadow-lg" />
        </div>
      </div>
      <div className="absolute -right-3 -top-3 flex size-9 items-center justify-center rounded-lg bg-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Plus className="size-[18px] text-devflow-primary" strokeWidth={2.5} />
      </div>
      <div className="absolute -left-5 bottom-5 flex size-8 items-center justify-center rounded-lg bg-[#d4e3ff] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Rocket className="size-3 text-[#004191]" />
      </div>
      <Box
        className="absolute bottom-8 right-5 size-6 text-[#0058be]/20"
        aria-hidden
      />
    </div>
  )
}
