type IconProps = { className?: string }

export function UserIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 12.25c0-2.07 2.24-3.75 5-3.75s5 1.68 5 3.75"
        stroke="#727785"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="17"
      height="14"
      viewBox="0 0 17 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M1.5 2.5h14v9h-14v-9Zm0 0 7 5.5 7-5.5"
        stroke="#727785"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="18"
      viewBox="0 0 14 18"
      fill="none"
      aria-hidden
    >
      <rect
        x="2"
        y="7"
        width="10"
        height="9"
        rx="1.5"
        stroke="#727785"
        strokeWidth="1.2"
      />
      <path
        d="M4.5 7V5a2.5 2.5 0 0 1 5 0v2"
        stroke="#727785"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} width="12" height="15" viewBox="0 0 12 15" fill="none" aria-hidden>
      <path
        d="M6 1 1.5 3v4.5c0 3.1 2 5.4 4.5 6.5 2.5-1.1 4.5-3.4 4.5-6.5V3L6 1Z"
        stroke="#727785"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function GaugeIcon({ className }: IconProps) {
  return (
    <svg className={className} width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden>
      <path
        d="M7.5 9.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-9v4.5l3 1.5"
        stroke="#727785"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6.5 1 3 7h3.5L5.5 11 9 5H5.5L6.5 1Z"
        stroke="#727785"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
