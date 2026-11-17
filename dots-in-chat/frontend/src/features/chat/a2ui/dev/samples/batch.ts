import type { Sample } from '../sample'

export const samples: Sample[] = [
  {
    id: 'batch-followups',
    title: 'BatchSend: remove, read and edit, send',
    user: "Follow up with everyone I haven't spoken to",
    lead: '4 people are due. Each one is removable, and nothing is sent until you tap.',
    components: [
      { id: 'root', component: 'Column', children: ['batch'] },
      {
        id: 'batch',
        component: 'BatchSend',
        people: [
          { name: 'Priya Sharma', detail: '45 days ago', message: 'Hey Priya! It has been a while. How are things at Zepto?' },
          { name: 'Rahul Mehta', detail: '30 days ago', message: 'Hi Rahul, hope you are well. Shall we catch up next week?' },
          { name: 'Ananya Reddy', detail: '14 days ago', message: 'Hi Ananya, saw your launch post. Congratulations!' },
          { name: 'Vikram Patel', detail: '14 days ago', message: 'Vikram, do you have time for a quick call this month?' },
        ],
      },
    ],
  },
]
