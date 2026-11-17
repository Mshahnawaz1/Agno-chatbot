/**
 * Per-block interaction checks, run by e2e/blocks.mjs against the gallery samples
 * (src/features/chat/a2ui/dev/samples). Each checks the live maths or the events a block sends.
 */
export default async function blockChecks({ page, check, assert, actions, card }) {
  const text = async (s) => (await card(s).textContent()) ?? ''

  await check('BudgetSplit: arrow key on a handle moves 1% between neighbours', async () => {
    const handle = card('budget-default').getByRole('slider').first()
    await handle.focus()
    await handle.press('ArrowRight')
    await handle.press('ArrowRight')
    const t = await text('budget-default')
    assert(/52%/.test(t) && /28%/.test(t), `expected 52 / 28, got: ${t.slice(0, 200)}`)
    assert(t.includes('₹41,600'), 'Needs amount did not follow')
    assert(t.includes('was 50 / 30 / 20') && t.includes('dragged'), 'no "was" line or dragged pill')
  })

  await check('QuadraticExplorer: changing c moves roots and discriminant', async () => {
    const c = card('quadratic-default').getByRole('slider').nth(2)
    await c.focus()
    for (let i = 0; i < 6; i++) await c.press('ArrowRight') // c: −3 → 0
    const t = await text('quadratic-default')
    assert(t.includes('Discriminant') && t.includes('4'), 'discriminant should be 4')
    assert(/x = 2, 0|x = 0, 2/.test(t), `roots should be 0 and 2: ${t.slice(0, 300)}`)
  })

  await check('ChartSwitcher: style toggles, a greyed style stays off', async () => {
    const c = card('charts-week')
    await c.getByRole('radio', { name: 'Line' }).click()
    assert((await c.getByRole('radio', { name: 'Line' }).getAttribute('aria-checked')) === 'true', 'Line not selected')
    assert(await c.getByRole('radio', { name: 'Pie' }).isDisabled(), 'Pie should be disabled for days of a week')
  })

  await check('ChartGallery: a tile sends pick_chart', async () => {
    await card('chartgallery-six').getByRole('button', { name: /Gauge/ }).click()
    const [a] = await actions('chartgallery-six')
    assert(a?.name === 'pick_chart' && a.context.type === 'gauge', 'pick_chart not sent')
  })

  await check('OrderReview: a tap does nothing, a 1.6 s hold places the order', async () => {
    const btn = card('order-basket').getByRole('button', { name: /Hold to place order/ })
    await btn.hover()
    await page.mouse.down()
    await page.waitForTimeout(400)
    await page.mouse.up()
    await page.waitForTimeout(300)
    assert((await actions('order-basket')).length === 0, 'short press placed the order')
    await btn.hover()
    await page.mouse.down()
    await page.waitForTimeout(1700)
    await page.mouse.up()
    const [a] = await actions('order-basket')
    assert(a?.name === 'place_order' && a.context.total === 199, `place_order wrong: ${JSON.stringify(a)}`)
  })

  await check('ReminderPicker: Set reminder sends the chosen time and repeat', async () => {
    const c = card('reminder-review')
    await c.getByRole('button', { name: /Tomorrow/ }).click()
    await c.getByRole('button', { name: 'Set reminder' }).click()
    const [a] = await actions('reminder-review')
    assert(a?.name === 'set_reminder', 'set_reminder not sent')
    assert(/T09:00/.test(a.context.at) && a.context.repeatDays === 2 && a.context.remindBefore === 45, JSON.stringify(a.context))
  })

  await check('RankList: keyboard move then "Use this order" sends the new order', async () => {
    const c = card('ranklist-week')
    const handle = c.getByRole('button', { name: /Reorder Workout/ })
    await handle.focus()
    await handle.press('Space')
    await handle.press('ArrowUp')
    await handle.press('ArrowUp')
    await handle.press('ArrowUp')
    await page.keyboard.press('Space')
    await c.getByRole('button', { name: 'Use this order' }).click()
    const [a] = await actions('ranklist-week')
    assert(a?.name === 'use_order' && a.context.items[0] === 'Workout', JSON.stringify(a?.context))
  })

  await check('MessageApproval: Undo stops the send; otherwise it goes after 8 s', async () => {
    const c = card('message-priya')
    await c.getByRole('button', { name: 'Send message' }).click()
    assert((await text('message-priya')).includes('Sent to Priya'), 'no sent line')
    await c.getByRole('button', { name: /Undo/ }).click()
    await page.waitForTimeout(1200)
    assert((await actions('message-priya')).length === 0, 'undo did not stop the send')
    await c.getByRole('button', { name: 'Send message' }).click()
    await page.waitForTimeout(9000)
    const sent = await actions('message-priya')
    assert(sent.length === 1 && sent[0].name === 'send_message' && sent[0].context.to === 'Priya Sharma', JSON.stringify(sent))
  })

  await check('DraftDiff: Approve & send carries the final text without removed parts', async () => {
    await card('draftdiff-weekly').getByRole('button', { name: 'Approve & send' }).click()
    const [a] = await actions('draftdiff-weekly')
    assert(a?.name === 'approve_send', 'approve_send not sent')
    assert(a.context.body.includes('Revenue is up 8%') && !a.context.body.includes('a bit low'), a.context.body)
  })

  await check('BatchSend: taking one person out sends to the other three', async () => {
    const c = card('batch-followups')
    await c.getByRole('button', { name: 'Include Ananya Reddy' }).click()
    await c.getByRole('button', { name: 'Send 3 messages' }).click()
    const [a] = await actions('batch-followups')
    assert(a?.name === 'send_batch' && a.context.people.length === 3, JSON.stringify(a?.context))
    assert(!a.context.people.some((p) => p.name === 'Ananya Reddy'), 'removed person was sent')
  })

  await check('No horizontal scroll at 360 px', async () => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('article[data-sample]')
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert(over <= 0, `page is ${over}px wider than the viewport`)
  })
}
