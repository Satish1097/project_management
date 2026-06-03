import type { Project } from '@/types/projects'

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Mobile App',
    description:
      'Redesigning the cross-platform experience for iOS and Android users.',
    status: 'active',
    icon: 'mobile',
    issuesLabel: '12 Open Issues',
    members: [
      { name: 'Alex', color: '#6366f1' },
      { name: 'Sam', color: '#ec4899' },
    ],
    extraMembers: 3,
  },
  {
    id: '2',
    name: 'Marketing Site',
    description: 'New landing pages for the Q3 product launch campaign.',
    status: 'planning',
    icon: 'web',
    issuesLabel: '0 Issues',
    members: [{ name: 'Chris', color: '#94a3b8', initials: 'JS' }],
  },
  {
    id: '3',
    name: 'API Service',
    description: 'Migrating legacy monolithic endpoints to a microservice mesh.',
    status: 'at_risk',
    icon: 'api',
    issuesLabel: '42 Critical Issues',
    issuesCritical: true,
    members: [
      { name: 'Jordan', color: '#f59e0b' },
      { name: 'Riley', color: '#14b8a6' },
    ],
  },
]
