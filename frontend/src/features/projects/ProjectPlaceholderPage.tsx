type ProjectPlaceholderPageProps = {
  title: string
  description: string
}

export function ProjectPlaceholderPage({
  title,
  description,
}: ProjectPlaceholderPageProps) {
  return (
    <main className="page-main">
      <div className="page-stack max-w-2xl">
        <h2 className="text-page-title text-devflow-text">{title}</h2>
        <p className="text-body text-devflow-text-secondary">{description}</p>
        <div className="rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-12 text-center">
          <p className="text-body text-devflow-text-secondary">
            This view will connect to your project API. Navigation and routing
            are ready for {title.toLowerCase()}.
          </p>
        </div>
      </div>
    </main>
  )
}
