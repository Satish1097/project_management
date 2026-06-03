import { Bug, Plus, Rocket, Zap } from 'lucide-react'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'
import { MetricCard } from '@/components/ui/MetricCard'

export function OperationsDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <WorkspaceSidebar />
      <div className={layout.shellMain}>
        <header className={cn(layout.appHeader, 'bg-[rgba(247,249,251,0.8)] backdrop-blur-sm')}>
          <span className="text-brand text-[#004191]">DevFlow Ops Center</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-lg bg-[#004191] px-4 py-1.5 text-btn text-white"
            >
              Deploy
            </button>
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-page-title text-devflow-text">
                Welcome back, Delivery Team.
              </h1>
              <p className="text-body text-devflow-text-secondary">
                System integrity at 99.8% across all service clusters.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-devflow-border bg-white px-4 py-2 text-btn"
              >
                <Plus className="size-3" />
                New Task
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-devflow-border bg-white px-4 py-2 text-btn"
              >
                <Bug className="size-3" />
                New Bug
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-[#004191] px-4 py-2 text-btn text-white"
              >
                <Rocket className="size-4" />
                Create Release
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Sprint Health"
              value="68%"
              sub="complete"
              badge={{ text: 'ON TRACK', variant: 'success' }}
              progress={68}
              footer="12 days left"
            />
            <MetricCard
              label="Open Bugs"
              value="14"
              sub="critical: 3"
              badge={{ text: '+2', variant: 'danger' }}
            />
            <MetricCard
              label="Deploy Frequency"
              value="4.2"
              sub="/ week"
              footer="↑ 12% vs last sprint"
            />
            <MetricCard
              label="MTTR"
              value="2.4h"
              sub="avg"
              badge={{ text: 'IMPROVING', variant: 'success' }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-devflow-border bg-white p-4 shadow-sm lg:col-span-2">
              <h2 className="text-section-title text-devflow-text">
                Pipeline Activity
              </h2>
              <div className="mt-3 flex h-48 items-center justify-center rounded-lg border border-dashed border-devflow-border bg-[rgba(224,227,229,0.2)]">
                <p className="text-devflow-text-secondary">
                  Engineering dashboard visualization
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-devflow-border bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-section-title text-devflow-text">
                <Zap className="size-5 text-[#004191]" />
                Recent Alerts
              </h2>
              <ul className="mt-4 space-y-3 text-body">
                <li className="rounded-lg bg-[#ffdad6] px-3 py-2 text-[#93000a]">
                  High CPU on api-gateway-02
                </li>
                <li className="rounded-lg bg-[#fef3c7] px-3 py-2 text-[#b45309]">
                  Sprint 42 burndown behind target
                </li>
                <li className="rounded-lg bg-[#d4e3ff] px-3 py-2 text-[#004191]">
                  Release v2.4.0-rc1 ready for QA
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
