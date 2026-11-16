/**
 * The blocks' zod schemas as plain JSON (property → type, required list), so a test can check
 * them against the server's JSON schemas (app/a2ui/catalogs/blocks/*.json). Dev only.
 */
import { z } from 'zod'
import { BLOCKS } from '../blocks'

export type PropShape = { type: string; items?: PropShape; properties?: Record<string, PropShape>; required?: string[] }

function shape(t: z.ZodTypeAny): PropShape {
  if (t instanceof z.ZodOptional || t instanceof z.ZodDefault || t instanceof z.ZodNullable) return shape(t._def.innerType)
  if (t instanceof z.ZodEffects) return shape(t._def.schema)
  if (t instanceof z.ZodNumber) return { type: 'number' }
  if (t instanceof z.ZodString || t instanceof z.ZodEnum || t instanceof z.ZodLiteral) return { type: 'string' }
  if (t instanceof z.ZodBoolean) return { type: 'boolean' }
  if (t instanceof z.ZodArray) return { type: 'array', items: shape(t._def.type) }
  if (t instanceof z.ZodObject) return objectShape(t)
  return { type: 'unknown' }
}

function objectShape(o: z.ZodObject<z.ZodRawShape>): PropShape {
  const properties: Record<string, PropShape> = {}
  const required: string[] = []
  for (const [k, v] of Object.entries(o.shape)) {
    properties[k] = shape(v as z.ZodTypeAny)
    if (!(v as z.ZodTypeAny).isOptional()) required.push(k)
  }
  return { type: 'object', properties, required: required.sort() }
}

export function blockSchemas(): Record<string, PropShape> {
  return Object.fromEntries(BLOCKS.map((b) => [b.name, objectShape(b.schema as z.ZodObject<z.ZodRawShape>)]))
}
