/**
 * Scenario tests for the renderer's line to the agent (src/features/chat/a2ui/renderer.ts).
 *
 *     npm run test:a2ui        (from dots-in-chat/frontend)
 *
 * Runs in plain Node with web_core and a tiny test catalog: no browser, no React.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'
import { BASIC_FUNCTIONS, Catalog, createFunctionImplementation } from '@a2ui/web_core/v1_0'
import { Renderer } from '../src/features/chat/a2ui/renderer.ts'

// the app's real clientInfo needs a browser's window; give it a stand-in screen
globalThis.window = { screen: { width: 1440, height: 900 } }
const { CLIENT_INFO } = await import('../src/features/chat/a2ui/catalog/functions.ts')

const ID = 'test/chat/v1'
const Text = { name: 'Text', schema: z.object({ text: z.string() }) }
const Column = { name: 'Column', schema: z.object({ children: z.array(z.string()) }) }

console.warn = () => {} // the renderer logs the errors it does not send

// renderer functions: one the agent may call, one that needs a user click, one only the renderer calls
const clientInfo = createFunctionImplementation(
  { name: 'clientInfo', returnType: 'object', allowedCallers: 'rendererOrAgent', schema: z.object({}).passthrough() },
  () => ({ timezone: 'Asia/Kolkata', locale: 'en-IN' }),
)
const openThing = createFunctionImplementation(
  { name: 'openThing', returnType: 'void', allowedCallers: 'rendererOnly', requiresUserActivation: true, schema: z.object({}).passthrough() },
  () => undefined,
)
const secret = createFunctionImplementation(
  { name: 'secret', returnType: 'string', allowedCallers: 'rendererOnly', schema: z.object({}).passthrough() },
  () => 'x',
)

function catalog() {
  return new Catalog(ID, '1.0', [Text, Column], [...BASIC_FUNCTIONS, clientInfo, openThing, secret])
}

function make(extra = {}) {
  const sent = { actions: [], errors: [], rpc: [] }
  const io = {
    sendAction: (a) => sent.actions.push(a),
    reportError: (e) => sent.errors.push(e),
    transport: async (m) => {
      sent.rpc.push(m)
      return extra.replies ? extra.replies(m) : []
    },
  }
  return { r: new Renderer(catalog(), io), sent }
}

const create = (id, extra = {}) => ({ version: '1.0', createSurface: { surfaceId: id, catalogId: ID, ...extra } })
const update = (id, components) => ({ version: '1.0', updateComponents: { surfaceId: id, components } })
const data = (id, value) => ({ version: '1.0', updateDataModel: { surfaceId: id, path: '/', value } })
const goodSurface = (id, extra) => [create(id, extra), update(id, [{ id: 'root', component: 'Text', text: 'hi' }])]
const badSurface = (id) => [create(id), update(id, [{ id: 'root', component: 'Text', text: 5 }])] // text must be a string

// ---------------------------------------------------------------- 1. error messages

test('a component that fails validation is reported as an error message for its surface', () => {
  const { r, sent } = make()
  r.apply(badSurface('s1'), true)
  assert.equal(sent.errors.length, 1)
  const e = sent.errors[0]
  assert.equal(e.version, '1.0')
  assert.equal(e.error.surfaceId, 's1')
  assert.match(e.error.code, /VALIDATION_FAILED|INVALID/)
  assert.ok(e.error.message.length > 0)
  assert.equal(r.processor.getSurface('s1')?.id, 's1')
})

test('a missing required property is reported', () => {
  const { r, sent } = make()
  r.apply([create('s1'), update('s1', [{ id: 'root', component: 'Column' }])], true)
  assert.equal(sent.errors.length, 1)
  assert.equal(sent.errors[0].error.surfaceId, 's1')
})

test('a message for a surface that does not exist is reported', () => {
  const { r, sent } = make()
  r.apply([update('ghost', [{ id: 'root', component: 'Text', text: 'x' }])], true)
  assert.equal(sent.errors.length, 1)
})

test('valid messages report nothing', () => {
  const { r, sent } = make()
  r.apply(goodSurface('s1'), true)
  assert.deepEqual(sent.errors, [])
})

test('replaying stored history never reports (it must not call the model on page load)', () => {
  const { r, sent } = make()
  r.apply(badSurface('old'), false)
  assert.deepEqual(sent.errors, [])
})

test('the same error is reported once', () => {
  const { r, sent } = make()
  r.apply(badSurface('s1'), true)
  r.apply([update('s1', [{ id: 'root', component: 'Text', text: 5 }])], true)
  assert.equal(sent.errors.length, 1)
})

test('an error on a surface from history stays quiet even when a live reply touches it', () => {
  const { r, sent } = make()
  r.apply(goodSurface('old'), false)
  r.apply([update('old', [{ id: 'root', component: 'Text', text: 5 }])], true)
  assert.equal(sent.errors.length, 1, 'the live update that broke it is reported')
  r.reset()
  r.apply(goodSurface('old'), false)
  sent.errors.length = 0
  r.processor.getSurface('old')?.dispatchError({ code: 'EXPRESSION_ERROR', message: 'late' })
  assert.deepEqual(sent.errors, [], 'a runtime error on a history surface is not sent')
})

test('a runtime expression error on a live surface is reported with its code', async () => {
  const { r, sent } = make()
  r.apply(goodSurface('s1'), true)
  await r.processor.getSurface('s1').dispatchError({ code: 'EXPRESSION_ERROR', message: 'division by zero' })
  assert.equal(sent.errors.length, 1)
  assert.deepEqual(sent.errors[0].error, { code: 'EXPRESSION_ERROR', message: 'division by zero', surfaceId: 's1' })
})

// ---------------------------------------------------------------- 2. sendDataModel

test('only surfaces that set sendDataModel are in a2uiRendererDataModel', () => {
  const { r } = make()
  r.apply([...goodSurface('plain'), data('plain', { a: 1 })], true)
  assert.equal(r.dataModel(), undefined)
  r.apply([...goodSurface('form', { sendDataModel: true }), data('form', { name: 'Asha', days: ['2'] })], true)
  assert.deepEqual(r.dataModel(), { version: '1.0', surfaces: { form: { name: 'Asha', days: ['2'] } } })
})

test('the data model follows what the user changed', () => {
  const { r } = make()
  r.apply([...goodSurface('form', { sendDataModel: true }), data('form', { name: '' })], true)
  r.processor.getSurface('form').dataModel.set('/name', 'Ravi')
  assert.deepEqual(r.dataModel().surfaces.form, { name: 'Ravi' })
})

test('a deleted surface leaves the data model', () => {
  const { r } = make()
  r.apply([...goodSurface('form', { sendDataModel: true }), data('form', { x: 1 })], true)
  r.apply([{ version: '1.0', deleteSurface: { surfaceId: 'form' } }], true)
  assert.equal(r.dataModel(), undefined)
})

// ---------------------------------------------------------------- 3. capabilities

test('capabilities list the real catalog ids', () => {
  const { r } = make()
  assert.deepEqual(r.capabilities(), { '1.0': { supportedCatalogIds: [ID] } })
})

// ---------------------------------------------------------------- 4. function RPC

test("the app's real clientInfo answers the agent with the browser's facts", async () => {
  const sent = []
  const r = new Renderer(new Catalog(ID, '1.0', [Text], [...BASIC_FUNCTIONS, CLIENT_INFO]), {
    sendAction: () => {},
    reportError: () => {},
    transport: async (m) => (sent.push(m), []),
  })
  await r.runCall({ version: '1.0', callRendererFunction: { functionCallId: 'c1', callFunction: { '@call': 'clientInfo', catalogId: ID, args: {} } } })
  const value = sent[0].rendererFunctionResponse.value
  assert.equal(typeof value.timezone, 'string')
  assert.equal(typeof value.locale, 'string')
  assert.match(value.localTime, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/)
  assert.equal(value.screenWidth, 1440)
})

test('the real catalog declares clientInfo callable by the agent, and nothing else is', async () => {
  assert.equal(CLIENT_INFO.allowedCallers, 'rendererOrAgent')
  assert.ok(!CLIENT_INFO.requiresUserActivation)
  const callable = [...BASIC_FUNCTIONS, CLIENT_INFO].filter((f) => f.allowedCallers && f.allowedCallers !== 'rendererOnly')
  assert.deepEqual(callable.map((f) => f.name), ['clientInfo'])
})

const call = (name, id = 'c1', extra = {}) => ({
  version: '1.0',
  callRendererFunction: { functionCallId: id, callFunction: { '@call': name, catalogId: ID, args: {} }, ...extra },
})

test('the agent calls a renderer function and gets a rendererFunctionResponse with its value', async () => {
  const { r, sent } = make()
  await r.runCall(call('clientInfo'))
  assert.equal(sent.rpc.length, 1)
  assert.deepEqual(sent.rpc[0].rendererFunctionResponse, {
    functionCallId: 'c1',
    value: { timezone: 'Asia/Kolkata', locale: 'en-IN' },
  })
})

test('a rendererOnly function refuses the agent (allowedCallers)', async () => {
  const { r, sent } = make()
  await r.runCall(call('secret'))
  const res = sent.rpc[0].rendererFunctionResponse
  assert.equal(res.functionCallId, 'c1')
  assert.equal(res.error.code, 'INVALID_FUNCTION_CALL')
  assert.match(res.error.message, /allowedCallers/)
})

test('a function that needs a user click refuses an agent call (requiresUserActivation)', async () => {
  const { r, sent } = make()
  await r.runCall(call('openThing'))
  const res = sent.rpc[0].rendererFunctionResponse
  assert.equal(res.error.code, 'INVALID_FUNCTION_CALL')
  assert.match(res.error.message, /activation|rendererOnly/)
})

test('an unknown function is answered with an error, never dropped', async () => {
  const { r, sent } = make()
  await r.runCall(call('nope', 'c9'))
  assert.equal(sent.rpc[0].rendererFunctionResponse.functionCallId, 'c9')
  assert.ok(sent.rpc[0].rendererFunctionResponse.error)
})

test('a callRendererFunction in stored history is not run again', () => {
  const { r, sent } = make()
  r.apply([call('clientInfo')], false)
  assert.deepEqual(sent.rpc, [])
})

test('the renderer calls an agent function: callAgentFunction goes out, the reply resolves it', async () => {
  const { r, sent } = make({
    replies: (m) => [
      {
        version: '1.0',
        agentFunctionResponse: { functionCallId: m.callAgentFunction.functionCallId, value: '2026-11-17T10:00:00Z' },
      },
    ],
  })
  r.apply(goodSurface('s1'), true)
  const value = await r.callAgent('s1', 'serverTime', { timezone: 'UTC' })
  assert.equal(value, '2026-11-17T10:00:00Z')
  assert.equal(sent.rpc[0].callAgentFunction.surfaceId, 's1')
  assert.deepEqual(sent.rpc[0].callAgentFunction.callFunction, { '@call': 'serverTime', catalogId: ID, args: { timezone: 'UTC' } })
})

test('an agent function error rejects the renderer call with its code', async () => {
  const { r } = make({
    replies: (m) => [
      {
        version: '1.0',
        agentFunctionResponse: {
          functionCallId: m.callAgentFunction.functionCallId,
          error: { code: 'UNKNOWN_FUNCTION', message: 'no such function' },
        },
      },
    ],
  })
  await assert.rejects(r.callAgent('s1', 'nope'), (e) => e.code === 'UNKNOWN_FUNCTION')
})

test('an agent function call that is never answered times out', async () => {
  const { r } = make()
  await assert.rejects(r.callAgent('s1', 'serverTime', {}, 30), (e) => e.code === 'TIMEOUT')
})
