import { AppLogo } from '@/components/brand/AppLogo'
import { BRANDING } from '@/constants/branding'
import { cn } from '@/utils/cn'

type SidebarBrandProps = {
  className?: string
  /** Override title color (e.g. ops sidebar uses primary). */
  titleClassName?: string
  collapsed?: boolean
}

/** Compact sidebar wordmark: logo + HKPMS + subtitle. */
export function SidebarBrand({
  className,
  titleClassName,
  collapsed = false,
}: SidebarBrandProps) {
  const logoPx = collapsed ? 32 : BRANDING.sidebarLogoSizePx

  return (
    <div
      className={cn(
        'flex min-w-0 items-center',
        collapsed ? 'justify-center' : 'gap-1.5',
        className,
      )}
    >
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ width: logoPx, height: logoPx }}
      >
        <AppLogo size={logoPx} className="size-full shrink-0" />
      </div>
      {!collapsed && (
        <div className="flex min-w-0 flex-col justify-center gap-px">
          <p
            className={cn(
              'text-[21px] font-bold leading-[1.05] text-devflow-brand',
              titleClassName,
            )}
          >
            {BRANDING.appName}
          </p>
          <p className="whitespace-nowrap text-[12px] font-medium leading-[1.2] text-devflow-text-muted opacity-[0.68]">
            {BRANDING.sidebarTagline}
          </p>
        </div>
      )}
    </div>
  )
}
