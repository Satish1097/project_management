export type WorkspaceMember = {
  id: string
  name: string
  email: string
  role: string
  color: string
}

export const mockMembers: WorkspaceMember[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    email: 'alex@devflow.io',
    role: 'Owner',
    color: '#d4e3ff',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@devflow.io',
    role: 'Admin',
    color: '#d8e2ff',
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    email: 'marcus@devflow.io',
    role: 'Member',
    color: '#e6e8ea',
  },
  {
    id: '4',
    name: 'Luna Park',
    email: 'luna@devflow.io',
    role: 'Member',
    color: '#ffdad6',
  },
]
