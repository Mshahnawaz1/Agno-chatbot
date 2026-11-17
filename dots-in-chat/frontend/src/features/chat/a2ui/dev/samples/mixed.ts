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
  {
    id: 'macro-lowered',
    title: 'A lowered macro (server expands Callout into basic components; its root keeps the call in metadata)',
    components: [
      { id: 'root', component: 'Column', children: ['tip'] },
      {
        id: 'tip',
        component: 'Card',
        child: 'tip__row_1',
        metadata: { extensions: { dotsMacro: { id: 'tip', component: 'Callout', title: 'Heads up', body: 'Prices change daily.', tone: 'warning' } } },
      },
      { id: 'tip__row_1', component: 'Row', align: 'center', children: ['tip__icon_1', 'tip__column_1'] },
      { id: 'tip__icon_1', component: 'Icon', name: 'warning' },
      { id: 'tip__column_1', component: 'Column', children: ['tip__text_1', 'tip__text_2'] },
      { id: 'tip__text_1', component: 'Text', text: 'Heads up' },
      { id: 'tip__text_2', component: 'Text', text: 'Prices change daily.', variant: 'caption' },
    ],
  },
]
