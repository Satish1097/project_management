import type { WorkspaceMember } from '@/services/mockMembers'

/** Mock logged-in user for project creation defaults. */
export const CURRENT_USER: WorkspaceMember = {
  id: '1',
  name: 'Alex Rivera',
  email: 'alex@devflow.io',
  role: 'Owner',
  color: '#6366f1',
}
