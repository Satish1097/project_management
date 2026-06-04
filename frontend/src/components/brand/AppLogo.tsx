import { BRANDING } from '@/constants/branding'
import { cn } from '@/utils/cn'

type AppLogoProps = {
  className?: string
  alt?: string
  /** Sets width/height attributes for crisp display at a fixed pixel size. */
  size?: number
}

/** HKPMS logo from `public/logo.png` — preserves aspect ratio in light and dark mode. */
export function AppLogo({
  className,
  alt = `${BRANDING.appName} logo`,
  size,
}: AppLogoProps) {
  return (
    <img
      src={BRANDING.logoPath}
      alt={alt}
      width={size}
      height={size}
      className={cn('object-contain', className)}
      decoding="async"
      draggable={false}
    />
  )
}
