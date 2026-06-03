import {
  ArrowDownUp,
  BookOpen,
  Compass,
  FolderPlus,
  Github,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyWorkspaceHeader } from '@/components/layout/EmptyWorkspaceHeader'
import { QuickActionCard } from '@/components/ui/QuickActionCard'
import { ROUTES } from '@/constants/routes'
import { EmptyStateIllustration } from './EmptyStateIllustration'

const quickActions = [
  {
    icon: BookOpen,
    title: 'Read the Quickstart',
    description:
      'Learn how to configure your workspace for maximum efficiency in 5 minutes.',
  },
  {
    icon: Users,
    title: 'Invite your team',
    description:
      'Engineering is a team sport. Add your collaborators to get started together.',
  },
  {
    icon: Github,
    title: 'Connect GitHub',
    description:
      'Sync your repositories and automate task completion via pull requests.',
  },
] as const

export function EmptyWorkspacePage() {
  return (
    <>
      <EmptyWorkspaceHeader activeTab="All Issues" />
      <main className="flex min-h-[calc(100vh-3rem)] flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="flex w-full max-w-xl flex-col items-center gap-4">
            <EmptyStateIllustration />

            <div className="flex flex-col items-center gap-2 pt-2 text-center">
              <h1 className="text-page-title text-devflow-text">
                Ready to build something great?
              </h1>
              <p className="max-w-md text-body text-[#424753]">
                Create your first project to start tracking tasks and
                collaborating with your team. Your journey to engineering
                excellence starts here.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to={ROUTES.dashboard}
                className="inline-flex items-center gap-2 rounded-lg bg-[#004191] px-4 py-2 text-btn text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]"
              >
                <FolderPlus className="size-5" strokeWidth={2} />
                Create New Project
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-devflow-border px-4 py-2 text-btn text-[#424753]"
              >
                <ArrowDownUp className="size-4" strokeWidth={2} />
                Import from Jira
              </button>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 pt-2 text-btn text-[#004191] hover:underline"
            >
              <Compass className="size-3.5" />
              Explore templates
            </button>
          </div>
        </section>

        <section className="px-4 pb-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} {...action} />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
