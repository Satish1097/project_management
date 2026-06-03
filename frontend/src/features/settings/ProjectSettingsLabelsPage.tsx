import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { MyTasksHeader } from '@/components/layout/MyTasksHeader'
import { ProjectSettingsTabs } from '@/components/layout/ProjectSettingsTabs'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { layout } from '@/constants/layout'
import { mockLabels } from '@/services/mockLabels'

export function ProjectSettingsLabelsPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <WorkspaceSidebar />
      <div className={layout.shellMain}>
        <MyTasksHeader />
        <main className="flex-1 p-4">
          <div className="mb-4">
            <h1 className="text-page-title tracking-[-0.64px] text-devflow-text">
              Project Settings
            </h1>
            <p className="text-body text-devflow-text-secondary">
              Manage your project preferences, labels, and workflow integrations.
            </p>
          </div>
          <ProjectSettingsTabs />
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-section-title text-devflow-text">Labels</h2>
                <p className="text-body text-devflow-text-secondary">
                  Create and manage labels to organize issues and roadmaps.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-[#004191] px-4 py-1.5 text-btn text-white"
              >
                <Plus className="size-2.5" strokeWidth={2.5} />
                Create Label
              </button>
            </div>
            <div className="space-y-4">
              {mockLabels.map((label) => (
                <div
                  key={label.id}
                  className="group flex h-12 items-center justify-between rounded-lg border border-devflow-border bg-white px-3"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-caption-label"
                      style={{
                        backgroundColor: label.bgColor,
                        color: label.textColor,
                      }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: label.dotColor }}
                      />
                      {label.name}
                    </span>
                    <span className="text-body text-devflow-text-secondary">
                      {label.description}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" className="p-2 text-devflow-text-secondary">
                      <Pencil className="size-4" />
                    </button>
                    <button type="button" className="p-2 text-devflow-text-secondary">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-caption-label tracking-[1px] text-devflow-text-muted">
              <Link to="#" className="hover:underline">
                Manage archived labels
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
