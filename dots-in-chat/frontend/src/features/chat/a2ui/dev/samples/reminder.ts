import type { Sample } from '../sample'

const d = new Date()
const iso = (add: number, h: number) =>
  `${new Date(d.getFullYear(), d.getMonth(), d.getDate() + add).toLocaleDateString('sv')}T${String(h).padStart(2, '0')}:00`

export const samples: Sample[] = [
  {
    id: 'reminder-review',
    title: 'ReminderPicker',
    user: 'Remind me to review the report',
    lead: 'When should I remind you? Pick below, or tap a quick option.',
    components: [
      {
        id: 'root',
        component: 'ReminderPicker',
        title: 'Review the report',
        options: [
          { label: 'Today 6 pm', at: iso(0, 18) },
          { label: 'Tomorrow 9 am', at: iso(1, 9) },
        ],
        remindBefore: 45,
        repeatDays: 2,
      },
    ],
  },
]
