import { Outlet } from 'react-router-dom'

/** Passthrough layout for /projects/:projectId/sprints/:sprintId/* child routes. */
export function SprintShell() {
  return <Outlet />
}
