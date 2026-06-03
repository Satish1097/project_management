import { TopHeader } from '@/components/layout/TopHeader'
import { SettingsSubNav } from '@/components/layout/SettingsSubNav'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ProjectSettingsPage() {
  return (
    <>
      <TopHeader variant="board" />
      <div className="flex flex-1">
        <SettingsSubNav />
        <section className="flex-1 overflow-auto bg-white p-4">
          <header className="mb-4">
            <h1 className="text-page-title text-devflow-text">
              General Settings
            </h1>
            <p className="mt-1 text-body text-devflow-text-secondary">
              Update your project identity and description.
            </p>
          </header>

          <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-label text-devflow-text-secondary">
                  Project Name
                </label>
                <Input defaultValue="DevFlow Ops" className="bg-[#f2f4f6]" />
              </div>
              <div>
                <label className="mb-1 block text-label text-devflow-text-secondary">
                  Project Key
                </label>
                <Input
                  defaultValue="DF"
                  className="bg-[#f2f4f6] font-mono"
                />
                <p className="mt-1 text-caption text-devflow-text-secondary">
                  Used as a prefix for issue IDs (e.g., DF-101).
                </p>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-label text-devflow-text-secondary">
                Description
              </label>
              <textarea
                defaultValue="Enterprise-grade high-velocity operations management for modern software development teams. Focused on speed, reliability, and automated workflows."
                className="min-h-32 w-full rounded-lg border border-devflow-border bg-[#f2f4f6] p-2.5 text-body text-devflow-text outline-none focus:ring-2 focus:ring-devflow-primary/20"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-devflow-border pt-4">
            <Button variant="outline" className="w-auto">
              Discard
            </Button>
            <Button className="w-auto">Save Changes</Button>
          </div>
        </section>
      </div>
    </>
  )
}
