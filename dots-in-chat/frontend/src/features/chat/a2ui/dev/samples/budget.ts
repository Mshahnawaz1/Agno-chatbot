import type { Sample } from '../sample'

export const samples: Sample[] = [
  {
    id: 'budget-default',
    title: 'BudgetSplit (3 parts) + Suggestions',
    user: 'Split my ₹80,000 salary',
    lead: 'Here is a 50 / 30 / 20 split. Drag a handle on the ring and the others rebalance.',
    components: [
      { id: 'root', component: 'Column', children: ['b', 'next'] },
      {
        id: 'b',
        component: 'BudgetSplit',
        income: 80000,
        parts: [{ label: 'Needs', percent: 50 }, { label: 'Wants', percent: 30 }, { label: 'Savings', percent: 20 }],
      },
      { id: 'next', component: 'Suggestions', prompt: 'Want me to keep 50 / 30 / 20, or raise savings?', options: ['Keep 50 / 30 / 20', 'Raise savings to 25%', 'Save this budget'] },
    ],
  },
  {
    id: 'budget-four',
    title: 'BudgetSplit with 4 parts',
    components: [
      {
        id: 'root',
        component: 'BudgetSplit',
        income: 120000,
        title: 'Household budget',
        parts: [{ label: 'Rent', percent: 35 }, { label: 'Food', percent: 20 }, { label: 'Fun', percent: 15 }, { label: 'Savings', percent: 30 }],
      },
    ],
  },
]
