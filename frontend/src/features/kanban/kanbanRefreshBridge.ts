let refreshHandler: (() => void) | null = null

export function registerKanbanRefresh(handler: () => void): () => void {
  refreshHandler = handler
  return () => {
    if (refreshHandler === handler) {
      refreshHandler = null
    }
  }
}

export function refreshKanbanBoard(): void {
  refreshHandler?.()
}
