import {
  Archive,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { SidebarBrand } from '@/components/brand/SidebarBrand'
import { SIDEBAR_NAV_ITEMS, isSidebarNavItemActive } from '@/components/layout/sidebarNav'
import { useSidebar } from '@/contexts/SidebarContext'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'



export function Sidebar() {

  const { pathname } = useLocation()

  const { collapsed, toggle } = useSidebar()

  return (

    <aside className={cn(layout.shellSidebar, 'justify-between overflow-hidden')}>

      <div

        className={cn(

          'flex flex-col gap-0.5',

          collapsed ? 'items-center px-2 py-3' : 'p-4',

        )}

      >

        <div className={cn('w-full', collapsed ? 'flex justify-center pb-2' : 'pb-2')}>

          <SidebarBrand

            collapsed={collapsed}

            titleClassName="text-devflow-primary"

          />

        </div>

        <nav
          className={cn(
            'flex flex-col gap-1',
            collapsed ? 'w-full items-center' : 'mt-1',
          )}
        >

          {SIDEBAR_NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {

            const active = isSidebarNavItemActive(id, pathname)



            return (

              <Link

                key={id}

                to={path}

                title={collapsed ? label : undefined}

                className={cn(

                  layout.navItem,

                  'text-body text-devflow-text-secondary transition-colors',

                  collapsed && 'w-9 justify-center px-0',

                  active &&

                    'bg-devflow-nav-active-alt text-devflow-nav-active-text-alt',

                )}

              >

                <Icon className="size-5 shrink-0" strokeWidth={1.75} />

                {!collapsed && <span className="truncate">{label}</span>}

              </Link>

            )

          })}

        </nav>

      </div>



      <div

        className={cn(

          'border-t border-devflow-border',

          collapsed ? 'flex flex-col items-center gap-1 px-2 py-3' : 'px-4 pb-4 pt-3',

        )}

      >

        <Link

          to="#"

          title={collapsed ? 'Help' : undefined}

          className={cn(

            layout.navItem,

            'text-body text-devflow-text-secondary hover:bg-devflow-hover-overlay',

            collapsed && 'w-9 justify-center px-0',

          )}

        >

          <HelpCircle className="size-5" strokeWidth={1.75} />

          {!collapsed && 'Help'}

        </Link>

        <Link

          to="#"

          title={collapsed ? 'Archive' : undefined}

          className={cn(

            layout.navItem,

            'text-body text-devflow-text-secondary hover:bg-devflow-hover-overlay',

            collapsed && 'w-9 justify-center px-0',

          )}

        >

          <Archive className="size-5" strokeWidth={1.75} />

          {!collapsed && 'Archive'}

        </Link>

        <button

          type="button"

          onClick={toggle}

          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}

          className={cn(

            layout.navItem,

            'mt-1 w-full text-body text-devflow-text-muted hover:bg-devflow-hover-overlay',

            collapsed && 'w-9 justify-center px-0',

          )}

        >

          {collapsed ? (

            <PanelLeftOpen className="size-5 shrink-0" strokeWidth={1.75} />

          ) : (

            <>

              <PanelLeftClose className="size-5 shrink-0" strokeWidth={1.75} />

              <span>Collapse</span>

            </>

          )}

        </button>

      </div>

    </aside>

  )

}


