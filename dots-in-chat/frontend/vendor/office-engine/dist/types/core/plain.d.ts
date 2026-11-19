/**
 * Plain formats opened as Office files: CSV / TSV become a workbook, text / Markdown / HTML a document, an SVG file
 * and Mermaid / PlantUML / Graphviz diagrams a document with the picture (Markdown code blocks in those languages
 * are drawn too). A gzip-compressed plain file (.svgz, .csv.gz) is unpacked first.
 * Used by the engine (a source that is not an Office package) and by File → Open.
 */
import { type ImportPara } from './convert';
import { type DiagramLang } from './diagram';
import { type ByteSource } from './source';
export type PlainFormat = 'csv' | 'tsv' | 'text' | 'markdown' | 'html' | 'svg' | DiagramLang;
export declare const PLAIN_EXT: Record<string, PlainFormat>;
/** formats shown with their source next to the document (and edited there) */
export declare const HAS_SOURCE: Set<PlainFormat>;
/** a file name extension and MIME type for each plain format (sources saved from the editor) */
export declare const PLAIN_FILE: Record<PlainFormat, {
    ext: string;
    mime: string;
}>;
/** what a plain format opens as */
export declare const PLAIN_KIND: Record<PlainFormat, 'xlsx' | 'docx'>;
export declare const extOf: (name?: string) => string;
/** the name of the file inside a gzip-compressed one: x.svgz → x.svg, x.csv.gz → x.csv; null for other names */
export declare function unpackedName(name?: string): string | null;
/** gzip's magic bytes */
export declare const isGzip: (b: Uint8Array) => boolean;
/** A gzip-compressed source (.svgz, .csv.gz) unpacked whole into memory (native DecompressionStream); any other source as it is. */
export declare function ungzipped(source: ByteSource): Promise<ByteSource>;
/** false for a name that says Office / iWork package: no need to look at its bytes */
export declare const mayBePlain: (name?: string) => boolean;
/**
 * Text of a file: the encoding asked for (`encoding`, a `TextDecoder` label), else the byte order mark, then the
 * declared charset, then UTF-8, then Windows-1258 (Excel's CSV on Vietnamese Windows) when the bytes read as
 * Vietnamese in it, then Windows-1252 (Excel's CSV on other Windows).
 */
export declare function decodeText(b: Uint8Array, type?: string, encoding?: string): string;
/** a web page saved as one file (MHTML: a MIME message whose parts are the HTML and its pictures) */
export declare const isMhtml: (text: string) => boolean;
/** The HTML part of an MHTML file (decoded from quoted-printable or base64), or the text when it has none. */
export declare function mhtmlToHtml(text: string): string;
/**
 * The plain format of a file from its name, MIME type and first bytes (`whole`: they are the whole file), or null
 * for an Office / iWork package or a binary file.
 */
export declare function plainFormat(name: string | undefined, type: string | undefined, head: Uint8Array, whole: boolean): PlainFormat | null;
/** Markdown: the text, and code blocks in a diagram language (```mermaid, ```plantuml, ```dot) as drawings */
export declare function markdownParas(md: string, dom?: boolean): ImportPara[];
/** HTML: the page's text, its diagram blocks as drawings */
export declare function htmlParas(html: string, dom?: boolean): ImportPara[];
/** Builds the workbook (CSV, TSV) or document (text, Markdown, HTML, SVG, diagrams) a plain file opens as; `name` names the sheet. */
export declare function plainToOffice(text: string, format: PlainFormat, name?: string): Promise<Blob>;
