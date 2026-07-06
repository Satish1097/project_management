type WorkspaceModulePlaceholderPageProps = {
  title: string
  description: string
}

export function WorkspaceModulePlaceholderPage({
  title,
  description,
}: WorkspaceModulePlaceholderPageProps) {
  return (
    <main className="page-main">
      <div className="page-stack max-w-2xl">
        <h2 className="text-page-title text-devflow-text">{title}</h2>
        <p className="text-body text-devflow-text-secondary">{description}</p>
        <div className="rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-12 text-center">
          <p className="text-body text-devflow-text-secondary">
            This workspace view is ready for API integration.
          </p>
        </div>
      </div>
    </main>
  )
}
