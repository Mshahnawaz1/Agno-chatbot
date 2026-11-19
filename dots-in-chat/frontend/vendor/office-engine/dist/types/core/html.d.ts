/**
 * HTML → paragraphs of formatted runs: clipboard HTML (main thread, parsed by the browser's DOMParser) and HTML files
 * (also in the worker, where a small DOM-free parser reads them).
 */
import type { Inline } from './docx/types';
export interface PastedPara {
    runs: Inline[];
    heading?: number;
    list?: 'bullet' | 'number';
    /** nesting of the list item (0: first level), when deeper */
    level?: number;
    /** `rich` only: a table, in place of a paragraph (`runs` is empty) */
    table?: PastedCell[][];
}
/** a cell of a pasted table, with the paragraphs it holds */
export interface PastedCell {
    colSpan: number;
    rowSpan: number;
    paras: PastedPara[];
}
/** What the conversion reads of a node: a DOM node, or one of the light parser's */
interface HNode {
    readonly nodeType: number;
    readonly textContent: string | null;
    readonly childNodes: ArrayLike<HNode>;
}
/**
 * Converts HTML (clipboard from Word, Google Docs, web pages; .html files) into paragraphs of formatted runs (`dom`: false reads it with the light parser also where DOMParser exists, as the worker does).
 * `rich` (the clipboard): data: pictures come out as picture runs and, with `tables`, tables as `table` paragraphs; else a table is flattened to tab-separated lines and pictures are left out.
 */
export declare function htmlToParas(html: string, dom?: boolean, rich?: {
    tables: boolean;
}): PastedPara[];
export declare function decodeEntities(s: string): string;
/**
 * A forgiving HTML parser for where there is no DOMParser (the worker): elements, text and entities, with the
 * end tags HTML lets a file leave out (paragraphs, list items, table rows and cells, the head).
 */
export declare function parseHtml(html: string): HNode;
export {};
