import type { Sample } from '../sample'

export const samples: Sample[] = [
  {
    id: 'quadratic-default',
    title: 'QuadraticExplorer y = x² − 2x − 3',
    user: 'Show me y = x² - 2x - 3',
    lead: 'Drag a, b or c. The curve, the roots and the numbers in the formula follow.',
    components: [{ id: 'root', component: 'QuadraticExplorer', a: 1, b: -2, c: -3 }],
  },
  {
    id: 'quadratic-noroots',
    title: 'QuadraticExplorer with no real roots',
    components: [{ id: 'root', component: 'QuadraticExplorer', a: -1, b: 2, c: -5 }],
  },
]
