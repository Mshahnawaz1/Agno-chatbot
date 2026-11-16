import type { Sample } from '../sample'

const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({ label, value: [420, 860, 300, 1240, 690, 1580, 980][i] }))

export const samples: Sample[] = [
  {
    id: 'charts-week',
    title: 'ChartSwitcher: ordered data, pie greyed',
    user: 'How much did I spend this week?',
    lead: '₹6,070 this week, highest on Saturday. Switch the style if another view reads better.',
    components: [
      { id: 'root', component: 'Column', children: ['c'] },
      { id: 'c', component: 'ChartSwitcher', title: 'Spending this week', data: week, partsOfWhole: false, ordered: true },
    ],
  },
  {
    id: 'charts-category',
    title: 'ChartSwitcher: donut, line greyed',
    components: [
      {
        id: 'root',
        component: 'ChartSwitcher',
        title: 'Spending by category',
        style: 'donut',
        styles: ['donut', 'bar', 'line'],
        partsOfWhole: true,
        ordered: false,
        data: [{ label: 'Food', value: 8200 }, { label: 'Transport', value: 3100 }, { label: 'Bills', value: 6400 }, { label: 'Fun', value: 2300 }],
      },
    ],
  },
  {
    id: 'charts-unit',
    title: 'ChartSwitcher: unit instead of money, area first',
    components: [
      { id: 'root', component: 'ChartSwitcher', title: 'Steps this week', unit: 'steps', style: 'area', data: week.map((d) => ({ label: d.label, value: d.value * 8 })) },
    ],
  },
  {
    id: 'chartgallery-six',
    title: 'ChartGallery: the six types in the design',
    user: 'What other ways can you show my data?',
    lead: 'These are the other chart types I can draw. I pick the one that fits your data.',
    components: [
      { id: 'root', component: 'Column', children: ['g'] },
      { id: 'g', component: 'ChartGallery', types: ['scatter', 'histogram', 'heatmap', 'radar', 'gauge', 'waterfall'] },
    ],
  },
  {
    id: 'chartgallery-more',
    title: 'ChartGallery: the remaining types, custom title',
    components: [{ id: 'root', component: 'ChartGallery', title: 'Pick a view', subtitle: 'Four familiar ones.', types: ['bar', 'line', 'area', 'donut'] }],
  },
]
