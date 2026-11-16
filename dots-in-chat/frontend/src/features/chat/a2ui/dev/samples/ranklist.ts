import type { Sample } from '../sample'

export const samples: Sample[] = [
  {
    id: 'ranklist-week',
    title: 'RankList',
    user: 'Plan my week',
    lead: 'Drag the handles to rank these. I will plan the week in this order.',
    components: [
      {
        id: 'root',
        component: 'RankList',
        title: 'Your priorities',
        items: ['Design review', 'Client feedback session', 'Project kickoff', 'Workout'],
      },
    ],
  },
]
