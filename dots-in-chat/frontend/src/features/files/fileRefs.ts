import type { FileKind, FileRef, Metrics } from '@/lib/types'
import { mergeFile } from '@/features/chat/chatStore'

export function fileName(path: string): string {
  return path.split('/').pop() || path
}

export function kindOf(path: string): FileKind | null {
  const ext = path.toLowerCase().split('.').pop()
  return ext === 'docx' || ext === 'pdf' || ext === 'html' || ext === 'md' || ext === 'xlsx' || ext === 'pptx' ? ext : null
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().replace(/\\/g, '/') : null
}

function argsOf(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

const RESULT_KINDS = new Set(['docx', 'pdf', 'html', 'md', 'xlsx', 'pptx'])
const ACTIONS = new Set(['created', 'updated', 'deleted'])

/** Chips from a run_skill_script result: JSON {ok, changed:[{path, action, kind}]}; anything odd => none. */
function changedFromScript(result: unknown): FileRef[] {
  if (typeof result !== 'string') return []
  let data: unknown
  try {
    data = JSON.parse(result)
  } catch {
    return []
  }
  if (!data || typeof data !== 'object') return []
  const { ok, changed } = data as { ok?: unknown; changed?: unknown }
  if (ok !== true || !Array.isArray(changed)) return []
  const out: FileRef[] = []
  for (const c of changed) {
    if (!c || typeof c !== 'object') continue
    const path = str((c as Record<string, unknown>).path)
    const kind = (c as Record<string, unknown>).kind
    const action = (c as Record<string, unknown>).action
    if (!path || typeof kind !== 'string' || !RESULT_KINDS.has(kind)) continue
    if (typeof action !== 'string' || !ACTIONS.has(action)) continue
    out.push({ path, kind: kind as FileKind, action: action as FileRef['action'] })
  }
  return out
}

/**
 * File changes of a stored reply, from its tool calls: FileTools (save_file / replace_file_chunk /
 * delete_file take `file_name`) and run_skill_script results (`changed` list).
 */
export function filesFromTools(tools: Metrics['tools']): FileRef[] {
  let files: FileRef[] = []
  for (const t of tools ?? []) {
    if (t.name === 'run_skill_script') {
      for (const f of changedFromScript(t.result)) files = mergeFile(files, f)
      continue
    }
    if (typeof t.result === 'string' && /^\s*error/i.test(t.result)) continue
    const args = argsOf(t.args)
    let path: string | null = null
    let action: FileRef['action'] = 'updated'
    switch (t.name) {
      case 'save_file':
        path = str(args.file_name)
        action = 'created'
        break
      case 'replace_file_chunk':
        path = str(args.file_name)
        break
      case 'delete_file':
        path = str(args.file_name)
        action = 'deleted'
        break
    }
    const kind = path ? kindOf(path) : null
    if (path && kind) files = mergeFile(files, { path, kind, action })
  }
  return files
}
