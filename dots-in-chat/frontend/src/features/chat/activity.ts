import type { LucideIcon } from 'lucide-react'
import { BookOpen, FilePen, FileText, FolderOpen, Search, Terminal, Trash2, Wrench } from 'lucide-react'
import type { Metrics } from '@/lib/types'

/** One thing the agent did before (or between) its answer, in the order it happened. */
export type Step =
  | { kind: 'thought'; id: string; text: string }
  | {
      kind: 'tool'
      id: string
      name: string
      args: Record<string, unknown>
      status: 'running' | 'done' | 'error'
      result?: string
    }

export type ToolStep = Extract<Step, { kind: 'tool' }>

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function base(path: string): string {
  return path.split('/').filter(Boolean).at(-1) ?? path
}

function humanize(name: string): string {
  return name.replace(/[_-]+/g, ' ').trim()
}

type Label = { running: string; done: string; icon: LucideIcon }

/** What a tool call reads as in the activity list: "Reading report.md", not `read_file`. */
export function toolLabel(name: string, args: Record<string, unknown>): Label {
  const file = str(args.file_name) ?? str(args.path)
  switch (name) {
    case 'get_skill_instructions': {
      const skill = str(args.name) ?? str(args.skill_name)
      return {
        running: skill ? `Reading the ${skill} skill` : 'Reading skill instructions',
        done: skill ? `Read the ${skill} skill` : 'Read skill instructions',
        icon: BookOpen,
      }
    }
    case 'search_skills':
      return { running: 'Looking for a skill', done: 'Looked for a skill', icon: Search }
    case 'run_skill_script': {
      const script = str(args.script)
      return {
        running: script ? `Running ${base(script)}` : 'Running a command',
        done: script ? `Ran ${base(script)}` : 'Ran a command',
        icon: Terminal,
      }
    }
    case 'read_file':
      return { running: file ? `Reading ${base(file)}` : 'Reading a file', done: file ? `Read ${base(file)}` : 'Read a file', icon: FileText }
    case 'save_file':
      return { running: file ? `Writing ${base(file)}` : 'Writing a file', done: file ? `Wrote ${base(file)}` : 'Wrote a file', icon: FilePen }
    case 'replace_file_chunk':
      return { running: file ? `Editing ${base(file)}` : 'Editing a file', done: file ? `Edited ${base(file)}` : 'Edited a file', icon: FilePen }
    case 'delete_file':
      return { running: file ? `Deleting ${base(file)}` : 'Deleting a file', done: file ? `Deleted ${base(file)}` : 'Deleted a file', icon: Trash2 }
    case 'list_files':
      return { running: 'Looking through files', done: 'Looked through files', icon: FolderOpen }
    case 'search_files':
      return { running: 'Searching files', done: 'Searched files', icon: Search }
    default: {
      const h = humanize(name)
      return { running: `Running ${h}`, done: `Ran ${h}`, icon: Wrench }
    }
  }
}

/** A stored reply's tool calls, as finished steps (history has no timing, only what ran). */
export function stepsFromHistory(reasoning: string | null | undefined, tools: Metrics['tools']): Step[] {
  const steps: Step[] = []
  if (reasoning?.trim()) steps.push({ kind: 'thought', id: 'h-thought', text: reasoning })
  ;(tools ?? []).forEach((t, i) => {
    const args = t.args && typeof t.args === 'object' ? (t.args as Record<string, unknown>) : {}
    const result = typeof t.result === 'string' ? t.result : JSON.stringify(t.result ?? '')
    steps.push({
      kind: 'tool', id: `h-tool${i}`, name: t.name, args,
      status: /^\s*error/i.test(result) ? 'error' : 'done', result,
    })
  })
  return steps
}
