let refreshHandlers = new Set<() => void>()

export function registerKanbanRefresh(handler: () => void): () => void {
  refreshHandlers.add(handler)
  return () => {
    refreshHandlers.delete(handler)
  }
}

export function refreshKanbanBoard(): void {
  refreshHandlers.forEach((handler) => handler())
}
