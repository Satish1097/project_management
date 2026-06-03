import { cn } from '@/utils/cn'

type DevFlowLogoProps = {
  className?: string
}

export function DevFlowLogo({ className }: DevFlowLogoProps) {
  return (
    <svg
      className={cn('h-[18px] w-5', className)}
      viewBox="0 0 20 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 2h6v4H5v2h4v4H3V2zm8 0h6v14h-6V2z"
        fill="white"
      />
    </svg>
  )
}
