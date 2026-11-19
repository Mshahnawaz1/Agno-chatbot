import { FileCode, FileSpreadsheet, FileText, Presentation, type LucideIcon } from 'lucide-react'
import type { FileRef } from '@/lib/types'

export const KIND_LABEL = { docx: 'Word document', pdf: 'PDF document', html: 'HTML page', md: 'Markdown', xlsx: 'Excel workbook', csv: 'CSV spreadsheet', pptx: 'PowerPoint deck' } as const
export const KIND_ICON: Record<FileRef['kind'], LucideIcon> = { docx: FileText, pdf: FileText, html: FileCode, md: FileText, xlsx: FileSpreadsheet, csv: FileSpreadsheet, pptx: Presentation }
