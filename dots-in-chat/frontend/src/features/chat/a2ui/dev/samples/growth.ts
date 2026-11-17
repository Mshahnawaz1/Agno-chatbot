import type { Sample } from '../sample'

export const samples: Sample[] = [
  {
    id: 'growth-sip',
    title: 'GrowthCalculator + Suggestions',
    user: 'What if I invest ₹10,000 a month?',
    lead: 'Here is a SIP you can play with. Drag a slider and every number and the curve update at once.',
    components: [
      { id: 'root', component: 'Column', children: ['calc', 'next'] },
      { id: 'calc', component: 'GrowthCalculator', monthly: 10000, rate: 12, years: 15 },
      {
        id: 'next',
        component: 'Suggestions',
        prompt: 'Want me to compare 20 years, or add inflation?',
        options: ['Make it 20 years', 'Add inflation', 'Save this plan'],
      },
    ],
    // The design's second frame: "Make it 20 years" → same card, recalculated, "changed".
    update: [
      { id: 'calc', component: 'GrowthCalculator', monthly: 10000, rate: 12, years: 20 },
      {
        id: 'next',
        component: 'Suggestions',
        prompt: 'Want inflation applied, or a lump sum added?',
        options: ['Add inflation', 'Add a lump sum', 'Save this plan'],
      },
    ],
  },
  {
    id: 'growth-extras',
    title: 'GrowthCalculator with lump sum and inflation',
    components: [{ id: 'root', component: 'GrowthCalculator', monthly: 10000, rate: 12, years: 20, lumpSum: 200000, inflation: 6 }],
  },
]
