import type { Sample } from '../sample'

export const samples: Sample[] = [
  {
    id: 'draftdiff-weekly',
    title: 'DraftDiff: the user edited the draft',
    user: 'Email the team the weekly report',
    lead: 'Here is the draft. Your edits show as a diff before anything sends.',
    components: [
      { id: 'root', component: 'Column', children: ['mail'] },
      {
        id: 'mail',
        component: 'DraftDiff',
        subject: 'Weekly report',
        recipients: ['Ananya Reddy', 'Vikram Patel', 'Rahul Mehta', 'Priya Sharma'],
        segments: [
          { text: 'Hi team, here is the weekly report. ' },
          { text: 'Numbers are a bit low this week.', change: 'removed' },
          { text: ' Revenue is up 8% on last week; two items need your call.\n\n', change: 'added' },
          { text: 'Thanks,', change: 'removed' },
          { text: ' Thanks, Pritam', change: 'added' },
        ],
      },
    ],
  },
]
