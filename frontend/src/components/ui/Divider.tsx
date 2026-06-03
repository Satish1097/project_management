export function Divider({ label = 'OR' }: { label?: string }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-devflow-border" />
      </div>
      <div className="relative flex h-4 justify-center">
        <span className="bg-white px-2 font-mono text-caption font-medium uppercase leading-4 tracking-[0.24px] text-devflow-text-muted">
          {label}
        </span>
      </div>
    </div>
  )
}
