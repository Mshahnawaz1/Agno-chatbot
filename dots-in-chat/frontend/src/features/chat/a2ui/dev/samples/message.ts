import type { Sample } from '../sample'

export const samples: Sample[] = [
  {
    id: 'message-priya',
    title: 'MessageApproval: send, undo, edit, not now',
    user: 'Follow up with Priya',
    lead: 'I drafted a message to Priya Sharma. Nothing is sent until you tap.',
    components: [
      { id: 'root', component: 'Column', children: ['msg'] },
      {
        id: 'msg',
        component: 'MessageApproval',
        to: 'Priya Sharma',
        detail: 'Product Manager at Zepto',
        channel: 'WhatsApp',
        message: "Hey Priya! It's been a while — would love to catch up and hear how things are going at Zepto.",
      },
    ],
  },
]
