/**
 * Phase 12.A audit, renderer side: the "Unknown" rows of the A2UI v1.0 audit, each run as a small
 * scenario against the app's real renderer (MessageProcessor + chat catalog + <A2uiSurface>).
 * Python side of the same rows: tests/test_a2ui_audit.py.
 *
 *   node e2e/audit.mjs          (from dots-in-chat/frontend)
 *
 * Each scenario is `done` (works), `partial` or `missing`, decided by what the assertions saw;
 * the script prints the table and exits 1 only if a scenario's verdict differs from EXPECTED
 * (so a fix that lands shows up as a changed verdict, and the table here gets updated).
 */
import { open } from './replay/harness.mjs'

const ID = 'dots-in-chat/chat/v1'
const S = 'audit'
const create = (extra = {}) => ({ version: '1.0', createSurface: { surfaceId: S, catalogId: ID, ...extra } })
const comps = (components) => ({ version: '1.0', updateComponents: { surfaceId: S, components } })
const data = (value, path = '/') => ({ version: '1.0', updateDataModel: { surfaceId: S, path, value } })

const { page, consoleErrors, close } = await open()
const reset = () => page.evaluate(() => window.__replay.reset())
const apply = (...m) => page.evaluate((m) => window.__replay.apply(m), m)
const text = () => page.evaluate(() => document.body.innerText)
const html = () => page.evaluate(() => document.body.innerHTML)

/** One scenario: returns {verdict, notes[]}. */
const scenarios = {
  async 'inline createSurface components + data'() {
    await reset()
    const r = await apply({
      ...create({
        components: [
          { id: 'root', component: 'Column', children: ['t'] },
          { id: 't', component: 'Text', text: { '@path': '/name' } },
        ],
        dataModel: { name: 'Inline Ada' },
      }),
    })
    const t = await text()
    const notes = [`errors=${JSON.stringify(r.errors)}`, `text=${JSON.stringify(t.trim())}`]
    return { ok: !r.errors.length && t.includes('Inline Ada'), notes }
  },

  async 'progressive render: orphan child, then fill in'() {
    await reset()
    const notes = []
    let r = await apply(create())
    r = await apply(comps([{ id: 'root', component: 'Column', children: ['a', 'b'] }, { id: 'a', component: 'Text', text: 'first' }]))
    const t1 = await text()
    notes.push(`after root + a (b missing): errors=${JSON.stringify(r.errors)} text=${JSON.stringify(t1.trim())}`)
    r = await apply(comps([{ id: 'b', component: 'Text', text: 'second' }]))
    const t2 = await text()
    notes.push(`after b: text=${JSON.stringify(t2.trim())}`)
    r = await apply(comps([{ id: 'a', component: 'Text', text: 'first (edited)' }]))
    const t3 = await text()
    notes.push(`after edit of a: text=${JSON.stringify(t3.trim())}`)
    r = await apply(comps([{ id: 'root', component: 'Column', children: ['a', 'b', 'c'] }]))
    const t4 = await text()
    notes.push(`root lists c before c exists: errors=${JSON.stringify(r.errors)} text=${JSON.stringify(t4.trim())}`)
    r = await apply(comps([{ id: 'c', component: 'Text', text: { '@path': '/late' } }]))
    r = await apply(data({ late: 'late data' }))
    const t5 = await text()
    notes.push(`data after components: text=${JSON.stringify(t5.trim())}`)
    const ok = t1.includes('first') && t2.includes('second') && t3.includes('(edited)') && t5.includes('late data')
    return { ok, notes }
  },

  async '@checks (spelling in the official examples)'() {
    await reset()
    const r = await apply(create(), comps([
      { id: 'root', component: 'Column', children: ['f'] },
      { id: 'f', component: 'TextField', label: 'Email', value: { '@path': '/e' }, '@checks': [{ condition: { '@call': 'required', args: { value: { '@path': '/e' } } }, message: 'Email required' }] },
    ]))
    return { ok: !r.errors.length, notes: [`errors=${JSON.stringify(r.errors).slice(0, 200)}`] }
  },

  async 'checks: field error + button disabled until valid'() {
    await reset()
    await apply(create({ dataModel: { e: '' } }), comps([
      { id: 'root', component: 'Column', children: ['f', 'btn'] },
      {
        id: 'f', component: 'TextField', label: 'Email', value: { '@path': '/e' },
        checks: [
          { condition: { '@call': 'required', args: { value: { '@path': '/e' } } }, message: 'Email is required' },
          { condition: { '@call': 'email', args: { value: { '@path': '/e' } } }, message: 'Not an email' },
        ],
      },
      { id: 'lbl', component: 'Text', text: 'Send' },
      {
        id: 'btn', component: 'Button', child: 'lbl', action: { event: { name: 'send' } },
        checks: [{ condition: { '@call': 'email', args: { value: { '@path': '/e' } } }, message: 'fix email' }],
      },
    ]))
    const notes = []
    const disabled0 = await page.locator('button', { hasText: 'Send' }).isDisabled()
    notes.push(`initial (empty): button disabled=${disabled0}`)
    const input = page.locator('input').first()
    await input.fill('nope')
    await input.blur()
    const err1 = (await text()).includes('Not an email')
    const invalid1 = await input.getAttribute('aria-invalid')
    notes.push(`"nope": message shown=${err1} aria-invalid=${invalid1} button disabled=${await page.locator('button', { hasText: 'Send' }).isDisabled()}`)
    await input.fill('a@b.co')
    const err2 = (await text()).includes('Not an email')
    const disabled2 = await page.locator('button', { hasText: 'Send' }).isDisabled()
    notes.push(`"a@b.co": message shown=${err2} button disabled=${disabled2}`)
    return { ok: disabled0 && err1 && invalid1 === 'true' && !err2 && !disabled2, notes }
  },

  async 'checks: ValidationResult object ({valid,message}) as a condition'() {
    await reset()
    // A DynamicBoolean may be a call returning a ValidationResult; `and` over the built-in validators does that.
    const r = await apply(create({ dataModel: { n: 'x' } }), comps([
      { id: 'root', component: 'Column', children: ['f'] },
      {
        id: 'f', component: 'TextField', label: 'Code', value: { '@path': '/n' },
        checks: [{ condition: { '@call': 'length', args: { value: { '@path': '/n' }, min: 3 } }, message: 'At least 3 characters' }],
      },
    ]))
    const input = page.locator('input').first()
    await input.focus()
    await input.blur()
    const shown = (await text()).includes('At least 3 characters')
    await input.fill('abcd')
    const gone = !(await text()).includes('At least 3 characters')
    return { ok: !r.errors.length && shown && gone, notes: [`errors=${JSON.stringify(r.errors)} shown=${shown} gone after valid=${gone}`] }
  },

  async 'accessibility prop (unprefixed) reaches the DOM'() {
    await reset()
    const r = await apply(create(), comps([
      { id: 'root', component: 'Column', children: ['lbl', 'b'] },
      { id: 'lbl', component: 'Text', text: 'Go' },
      { id: 'b', component: 'Button', child: 'lbl', action: { event: { name: 'go' } }, accessibility: { label: 'Send the form now', description: 'Sends it' } },
    ]))
    const h = await html()
    const hasLabel = h.includes('Send the form now')
    return { ok: !r.errors.length && hasLabel, notes: [`errors=${JSON.stringify(r.errors)} label in DOM=${hasLabel}`, `button html=${(await page.locator('button').first().evaluate((e) => e.outerHTML)).slice(0, 200)}`] }
  },

  async '@accessibility (spelling in the spec at main)'() {
    await reset()
    const r = await apply(create(), comps([
      { id: 'root', component: 'Column', children: ['lbl', 'b'] },
      { id: 'lbl', component: 'Text', text: 'Go' },
      { id: 'b', component: 'Button', child: 'lbl', action: { event: { name: 'go' } }, '@accessibility': { label: 'Send the form now' } },
    ]))
    return { ok: !r.errors.length, notes: [`errors=${JSON.stringify(r.errors).slice(0, 200)}`] }
  },

  async 'template list from a data array'() {
    await reset()
    const r = await apply(create({ dataModel: { people: [{ n: 'Ann' }, { n: 'Bob' }, { n: 'Cy' }] } }), comps([
      { id: 'root', component: 'List', children: { path: '/people', componentId: 'row' } },
      { id: 'row', component: 'Text', text: { '@path': 'n' } },
    ]))
    const t = await text()
    const dataLater = await (async () => {
      await apply(data([{ n: 'Dee' }, { n: 'Eve' }], '/people'))
      return text()
    })()
    return { ok: !r.errors.length && /Ann[\s\S]*Bob[\s\S]*Cy/.test(t) && dataLater.includes('Eve') && !dataLater.includes('Ann'), notes: [`errors=${JSON.stringify(r.errors)} text=${JSON.stringify(t.trim())} after data update=${JSON.stringify(dataLater.trim())}`] }
  },

  async '@index in a template (no offset)'() {
    await reset()
    const r = await apply(create({ dataModel: { people: [{ n: 'Ann' }, { n: 'Bob' }, { n: 'Cy' }] } }), comps([
      { id: 'root', component: 'List', children: { path: '/people', componentId: 'row' } },
      { id: 'row', component: 'Text', text: { '@call': 'formatString', args: { value: '#${@index()} ${n}' } } },
    ]))
    const t = await text()
    return { ok: !r.errors.length && /#0 Ann[\s\S]*#1 Bob[\s\S]*#2 Cy/.test(t), notes: [`errors=${JSON.stringify(r.errors)} text=${JSON.stringify(t.trim())}`] }
  },

  async '@index with offset (formatString and direct call forms)'() {
    const forms = {
      'formatString ${@index(offset: 1)}': { '@call': 'formatString', args: { value: '${@index(offset: 1)}. ${n}' } },
      'formatString ${@index(1)}': { '@call': 'formatString', args: { value: '${@index(1)}. ${n}' } },
      'direct call args.offset': { '@call': '@index', args: { offset: 1 } },
      'direct call, no offset': { '@call': '@index' },
    }
    const notes = []
    let ok = true
    for (const [label, textValue] of Object.entries(forms)) {
      await reset()
      const r = await apply(create({ dataModel: { people: [{ n: 'Ann' }, { n: 'Bob' }] } }), comps([
        { id: 'root', component: 'List', children: { path: '/people', componentId: 'row' } },
        { id: 'row', component: 'Text', text: textValue },
      ]))
      const t = (await text()).trim().replace(/\n+/g, ' | ')
      const want = label.includes('no offset') ? /0[\s\S]*1/ : /1\. Ann[\s\S]*2\. Bob|^1[\s\S]*2/
      const good = !r.errors.length && want.test(t)
      notes.push(`${good ? 'ok  ' : 'FAIL'} ${label}: text=${JSON.stringify(t)} errors=${JSON.stringify(r.errors).slice(0, 120)}`)
      if (!good && label.startsWith('direct')) ok = false  // string interpolation forms are reported, not required
    }
    return { ok, notes }
  },
}

// What this audit found on 2026-11-17 (A2UI web_core 0.15.0, SDK 0.11.0). Update when behaviour changes.
const EXPECTED = JSON.parse(
  (await import('node:fs')).readFileSync(new URL('../../tests/fixtures/audit_expected.json', import.meta.url), 'utf8'),
).renderer

const results = []
for (const [name, fn] of Object.entries(scenarios)) {
  consoleErrors.length = 0
  let r
  try {
    r = await fn()
  } catch (e) {
    r = { ok: false, notes: ['threw: ' + (e instanceof Error ? e.message.split('\n')[0] : String(e))] }
  }
  if (consoleErrors.length) r.notes.push('console: ' + consoleErrors[0].slice(0, 160))
  results.push({ name, ...r })
}
await close()

let unexpected = 0
for (const r of results) {
  const want = EXPECTED[r.name]
  const got = r.ok ? 'works' : 'fails'
  const flag = want === got ? '' : '   <-- differs from EXPECTED (' + want + ')'
  if (flag) unexpected++
  console.log(`${got.padEnd(6)} ${r.name}${flag}`)
  for (const n of r.notes) console.log('         ' + n)
}
console.log(`\naudit (renderer): ${results.filter((r) => r.ok).length} work, ${results.filter((r) => !r.ok).length} fail, ${unexpected} differ from expected`)
process.exit(unexpected ? 1 : 0)
