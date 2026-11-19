/**
 * A Markdown / HTML file saved after it was edited as a document. The document model holds only what the importer
 * understands (paragraphs of formatted runs: no nested lists, tables, code blocks, quotes, front matter, pictures
 * inside text), so writing the file from the model alone drops the rest. Instead the source is cut into chunks, each
 * knowing the paragraphs it imported as; the edited document is aligned with the imported paragraphs, a chunk whose
 * paragraphs all came back unchanged is kept verbatim, and only what was edited is written from the model.
 */
import type { Block } from './docx/types';
export type MergeFormat = 'markdown' | 'html';
/**
 * The file's text after the document was edited: what came back unchanged as it was in `source`, the rest written by
 * `write` from the edited blocks. null when the source cannot be told apart that way (the caller then writes the
 * whole file from the model).
 */
export declare function mergeSource(source: string, format: MergeFormat, blocks: Block[], write: (blocks: Block[]) => string): string | null;
