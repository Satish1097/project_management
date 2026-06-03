import { Check, Circle, Clock } from 'lucide-react'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'

const checklist = [
  { id: '1', label: 'All P0 bugs resolved', done: true },
  { id: '2', label: 'Security scan passed', done: true },
  { id: '3', label: 'Performance benchmarks met', done: false },
  { id: '4', label: 'Rollback plan documented', done: false },
  { id: '5', label: 'Stakeholder sign-off', done: false },
]

const timeline = [
  { id: '1', label: 'Code freeze', time: 'Mon 9:00 AM', done: true },
  { id: '2', label: 'Staging Deploy', time: 'Tue 2:00 PM', done: true },
  { id: '3', label: 'QA Sign-off', time: 'Wed 11:00 AM', done: false, current: true },
  { id: '4', label: 'Production Deploy', time: 'Thu 6:00 AM', done: false },
]

export function ReleaseManagementPage() {
  const doneCount = checklist.filter((c) => c.done).length

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <WorkspaceSidebar />
      <div className={layout.shellMain}>
        <header className={cn(layout.appHeader, 'bg-[rgba(247,249,251,0.8)]')}>
          <span className="text-brand text-[#004191]">Release Tracker</span>
          <button
            type="button"
            className="rounded-lg bg-[#004191] px-3 py-1.5 text-btn text-white"
          >
            Deploy
          </button>
        </header>
        <main className="flex-1 space-y-4 p-4">
          <div>
            <h1 className="text-page-title text-devflow-text">
              Release v2.4.0-rc1
            </h1>
            <p className="text-body text-devflow-text-secondary">
              Target production deploy: Thursday 6:00 AM UTC
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-devflow-border bg-white p-4 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-card-title">Deployment Checklist</h2>
                <span className="text-body text-devflow-text-secondary">
                  {doneCount}/{checklist.length} complete
                </span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#eceef0]">
                <div
                  className="h-full bg-[#10b981]"
                  style={{ width: `${(doneCount / checklist.length) * 100}%` }}
                />
              </div>
              <ul className="space-y-3">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-devflow-border px-4 py-3"
                  >
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full',
                        item.done
                          ? 'bg-[#10b981] text-white'
                          : 'border-2 border-devflow-border',
                      )}
                    >
                      {item.done && <Check className="size-3" />}
                    </span>
                    <span
                      className={
                        item.done
                          ? 'text-caption text-devflow-text-muted line-through'
                          : 'text-body font-medium text-devflow-text'
                      }
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-6 w-full rounded-lg bg-[#004191] py-3 text-btn text-white"
              >
                Approve & Deploy to Production
              </button>
            </div>

            <div className="rounded-lg border border-devflow-border bg-white p-4 shadow-sm">
              <h2 className="text-section-title text-devflow-text">
                Deployment Timeline
              </h2>
              <ul className="mt-6 space-y-4">
                {timeline.map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.done ? (
                        <Check className="size-5 text-[#10b981]" />
                      ) : step.current ? (
                        <Clock className="size-5 text-[#004191]" />
                      ) : (
                        <Circle className="size-5 text-devflow-border" />
                      )}
                      <div className="mt-1 w-px flex-1 bg-devflow-border" />
                    </div>
                    <div className="pb-4">
                      <p
                        className={cn(
                          'text-btn',
                          step.current ? 'text-[#004191]' : 'text-devflow-text',
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-caption text-devflow-text-muted">{step.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-devflow-border bg-white p-4 shadow-sm">
            <h2 className="text-card-title">Included Issues (24)</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {['DF-101', 'DF-1085', 'DF-1102', 'DF-1124'].map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg bg-devflow-surface px-3 py-2"
                >
                  <span className="font-mono text-caption text-devflow-text-muted">
                    {key}
                  </span>
                  <span className="text-body text-devflow-text-secondary">
                    Ready for release
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
