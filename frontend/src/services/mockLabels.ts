export type ProjectLabel = {
  id: string
  name: string
  description: string
  dotColor: string
  bgColor: string
  textColor: string
}

export const mockLabels: ProjectLabel[] = [
  {
    id: '1',
    name: 'BUG',
    description: "Something isn't working",
    dotColor: '#ba1a1a',
    bgColor: '#ffdad6',
    textColor: '#ba1a1a',
  },
  {
    id: '2',
    name: 'FRONTEND',
    description: 'User interface and client-side tasks',
    dotColor: '#004191',
    bgColor: '#d8e2ff',
    textColor: '#004191',
  },
  {
    id: '3',
    name: 'BACKEND',
    description: 'Server-side logic and database tasks',
    dotColor: '#39485e',
    bgColor: '#d4e3ff',
    textColor: '#39485e',
  },
  {
    id: '4',
    name: 'ENHANCEMENT',
    description: 'New features or improvements',
    dotColor: '#3d4559',
    bgColor: '#dae2fc',
    textColor: '#3d4559',
  },
  {
    id: '5',
    name: 'DOCS',
    description: 'Documentation and knowledge base',
    dotColor: '#727784',
    bgColor: '#e6e8ea',
    textColor: '#424753',
  },
]
