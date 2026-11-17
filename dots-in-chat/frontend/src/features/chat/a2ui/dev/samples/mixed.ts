import type { Sample } from '../sample'

/** Mixed catalogs: one surface holds components of the basic, VegaChart and blocks catalogs. */
export const samples: Sample[] = [
  {
    id: 'mixed-catalogs',
    title: 'Mixed catalogs: basic Card + VegaChart + GrowthCalculator + Modal',
    user: 'Show my savings plan with a chart.',
    lead: 'A basic card holds a chart from the VegaChart catalog and a live block from ours.',
    components: [
      { id: 'root', component: 'Card', child: 'col' },
      { id: 'col', component: 'Column', children: ['title', 'chart', 'calc', 'more'] },
      { id: 'title', component: 'Text', text: '### Savings plan' },
      {
        id: 'chart',
        component: 'VegaChart',
        height: 180,
        spec: {
          mark: 'bar',
          data: { values: [{ year: '1', total: 1.2 }, { year: '2', total: 2.5 }, { year: '3', total: 3.9 }] },
          encoding: { x: { field: 'year', type: 'nominal' }, y: { field: 'total', type: 'quantitative' } },
        },
      },
      { id: 'calc', component: 'GrowthCalculator', monthly: 10000, rate: 12, years: 15 },
      { id: 'more', component: 'Modal', trigger: 'open', content: 'body' },
      { id: 'open', component: 'Button', child: 'open_label', variant: 'borderless', action: { event: { name: 'noop' } } },
      { id: 'open_label', component: 'Text', text: 'Show assumptions' },
      { id: 'body', component: 'Text', text: 'Assumes a steady 12% yearly return.' },
    ],
  },
  {
    id: 'legacy-surface',
    title: 'A surface stored before mixed catalogs (one merged catalog id)',
    legacy: true,
    components: [
      { id: 'root', component: 'Column', children: ['t', 'calc'] },
      { id: 't', component: 'Text', text: 'Stored with the old single catalog id.' },
      { id: 'calc', component: 'GrowthCalculator', monthly: 5000, rate: 10, years: 10 },
    ],
  },
]
