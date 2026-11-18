import type { FileKind, FileRef, Metrics } from '@/lib/types'
import { mergeFile } from '@/features/chat/chatStore'

export function fileName(path: string): string {
  return path.split('/').pop() || path
}

export function kindOf(path: string): FileKind | null {
  const ext = path.toLowerCase().split('.').pop()
  return ext === 'docx' || ext === 'md' ? ext : null
}

const stem = (path: string) => path.replace(/\.(docx|md)$/i, '')

/**
 * What the chips show: one per path, and a .md source is hidden when its .docx twin is there
 * (the agent writes report.md, then builds report.docx: the user cares about the document).
 */
export function visibleFiles(files: FileRef[]): FileRef[] {
  const docx = new Set(files.filter((f) => f.kind === 'docx').map((f) => stem(f.path)))
  return files.filter((f) => f.kind === 'docx' || !docx.has(stem(f.path)))
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

/**
 * File changes of a stored reply, from its tool calls (FileTools: save_file / replace_file_chunk /
 * delete_file take `file_name`; DocxTools: build_docx(source, output) writes `output`, or
 * `<source>.docx` when output is empty).
 */
export function filesFromTools(tools: Metrics['tools']): FileRef[] {
  let files: FileRef[] = []
  for (const t of tools ?? []) {
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
      case 'build_docx': {
        const source = str(args.source)
        path = str(args.output) ?? (source ? `${stem(source)}.docx` : null)
        const md = source && files.find((f) => f.path === source)
        action = md && md.action === 'created' ? 'created' : 'updated'
        break
      }
    }
    const kind = path ? kindOf(path) : null
    if (path && kind) files = mergeFile(files, { path, kind, action })
  }
  return files
}
