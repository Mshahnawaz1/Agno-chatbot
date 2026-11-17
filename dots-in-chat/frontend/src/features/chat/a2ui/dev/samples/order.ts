import type { Sample } from '../sample'

const items = [
  { name: 'Amul Milk 500 ml', qty: 1, price: 59 },
  { name: 'Eggs 6 pcs', qty: 1, price: 49 },
  { name: 'Amul Butter 100 g', qty: 1, price: 30 },
]

export const samples: Sample[] = [
  {
    id: 'order-basket',
    title: 'OrderReview: hold to place',
    user: 'Place the order',
    lead: 'Your basket is ready. Review it before I charge your card.',
    components: [
      {
        id: 'root',
        component: 'OrderReview',
        items,
        fees: [{ label: 'Delivery + taxes', amount: 61 }],
        payment: 'UPI ending 4821',
      },
    ],
  },
]
