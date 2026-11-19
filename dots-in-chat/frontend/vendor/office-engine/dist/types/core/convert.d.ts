import type { RunSet } from './docx/types';
/** rows as delimited text: a field is quoted when it holds the separator, a quote, a line break or outer spaces */
export declare function toCsv(rows: string[][], sep?: string): string;
/** Separator of a delimited text file: tab, semicolon (European CSV) or comma. */
export declare function detectSeparator(text: string): string;
/** RFC 4180 parser (quoted fields, escaped quotes, CRLF / LF, newlines inside quotes). */
export declare function parseCsv(text: string, sep?: string): string[][];
/**
 * What a delimited text field holds: a number (not a code like "007", nor one of more than 15 digits), a boolean, or
 * text (null). `decimalComma`: "12,5" is a number. Cheap for the common case: text allocates nothing.
 */
export declare function fieldValue(v: string, decimalComma?: boolean): number | boolean | null;
/**
 * Builds a one-sheet workbook from rows of text.
 * `decimalComma`: "12,5" is a number (semicolon-separated files from comma-decimal locales).
 */
export declare function rowsToXlsx(rows: string[][], sheetName?: string, decimalComma?: boolean): Promise<Blob>;
export interface ImportRun {
    text: string;
    set?: RunSet;
    href?: string;
}
/** a picture of its own paragraph: an SVG drawing (diagrams) */
export interface ImportImage {
    svg: string;
    /** size in px (1/96 in) */
    w: number;
    h: number;
    alt?: string;
}
export interface ImportPara {
    runs: ImportRun[];
    /** heading level 1-6 */
    heading?: number;
    list?: 'bullet' | 'number';
    align?: 'center';
    image?: ImportImage;
}
export interface DocxOptions {
    /** Letter landscape instead of portrait */
    landscape?: boolean;
}
/** One paragraph per line. */
export declare function textToParas(text: string): ImportPara[];
/** Small CommonMark subset → HTML: headings, paragraphs, lists, quotes, code blocks, rules, tables. */
export declare function markdownToHtml(md: string): string;
/** Builds a document (Letter, 1" margins, Calibri 11) from paragraphs of formatted runs and pictures. */
export declare function parasToDocx(paras: ImportPara[], opts?: DocxOptions): Promise<Blob>;
/** the Office theme of new presentations (also used by converted Keynote files) */
export declare const THEME: string;
/** One empty title slide, 16:9, Office theme; layouts: title, title and content, blank. */
export declare function blankPptx(): Promise<Blob>;
