import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

type SidebarNavSectionProps = {
  label: string
  collapsed: boolean
  children: React.ReactNode
}

export function SidebarNavSection({
  label,
  collapsed,
  children,
}: SidebarNavSectionProps) {
  return (
    <section className="sidebar-section">
      {!collapsed && <h2 className="sidebar-section-label">{label}</h2>}
      <div className={cn('sidebar-section-items', collapsed && 'items-center')}>
        {children}
      </div>
    </section>
  )
}

function sidebarNavItemClass(active: boolean, collapsed: boolean) {
  return cn(
    'sidebar-nav-item',
    collapsed && 'sidebar-nav-item--collapsed',
    active && 'sidebar-nav-item--active',
  )
}

type SidebarNavLinkProps = {
  to: string
  label: string
  icon: LucideIcon
  active: boolean
  collapsed: boolean
  onClick?: () => void
}

export function SidebarNavLink({
  to,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: SidebarNavLinkProps) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={sidebarNavItemClass(active, collapsed)}
    >
      <Icon className="sidebar-nav-icon" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

type SidebarNavButtonProps = {
  label: string
  icon: LucideIcon
  active?: boolean
  collapsed: boolean
  disabled?: boolean
  onClick: () => void
}

export function SidebarNavButton({
  label,
  icon: Icon,
  active = false,
  collapsed,
  disabled,
  onClick,
}: SidebarNavButtonProps) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      disabled={disabled}
      onClick={onClick}
      className={sidebarNavItemClass(active, collapsed)}
    >
      <Icon className="sidebar-nav-icon" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )
}
