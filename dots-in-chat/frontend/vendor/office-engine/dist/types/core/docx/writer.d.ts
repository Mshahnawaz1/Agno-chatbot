import { type RChild, type RNode } from '../raw';
import type { DocxDocument, GenRun } from './parser';
import type { Block, CanonStyle, EditOp, EditResult, ParaSpec, StyleInfo, StyleLook, StyleSetResult, TableOp, TableSpec, PageSet, PageSetResult, HFSet, HFSetResult } from './types';
export declare const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
interface ParaLoc {
    node: RNode;
    list: RChild[];
    index: number;
}
/** Paragraphs of a body item in the same preorder the converter uses. */
export declare function collectParasRaw(nodes: RChild[]): ParaLoc[];
export declare function collectRunsRaw(p: RNode): RNode[];
export declare function origPara(doc: DocxDocument, pid: number): RNode | undefined;
/** Id of a built-in paragraph style (Title, Heading 1…), added to styles.xml when the document lacks it. */
export declare function ensureStyle(doc: DocxDocument, kind: CanonStyle): Promise<{
    id: string;
    styles: StyleInfo[];
}>;
/**
 * Gives paragraph style `id` a look, in the document's own styles part: every paragraph of that style, and of the
 * styles based on it, follows. The style only defines what differs from the style it is based on.
 */
export declare function setStyleLook(doc: DocxDocument, id: string, asked: StyleLook): Promise<StyleSetResult>;
export declare function genParagraph(doc: DocxDocument, spec: ParaSpec): Promise<{
    xml: string;
    map: GenRun[];
}>;
/**
 * The blocks each paragraph converts to with the styles as they are now (after a style changed), in the order
 * given. The document stays as it is, but for the look of list markers, which follows the paragraphs'.
 * `bare`: as the paragraphs look outside their table (nothing taken from a table style).
 */
export declare function convertParas(doc: DocxDocument, specs: ParaSpec[], bare?: boolean): Promise<Block[][]>;
export declare function applyEdit(doc: DocxDocument, op: EditOp): Promise<EditResult>;
/** Adds an image part to the document; returns its relationship id and part path. */
export declare function addImage(doc: DocxDocument, bytes: Uint8Array, ext: string): Promise<{
    rid: string;
    path: string;
}>;
/** External hyperlink relationship; returns the run link key ('r:rIdN'). */
export declare function addLink(doc: DocxDocument, url: string): Promise<string>;
/** a border element from a CSS line ('0.5pt solid #000000', 'none') */
export declare function borderXml(W: string, side: string, css: string): string;
/** Regenerates a whole table from the editor model, reusing original row/cell properties. */
export declare function genTable(doc: DocxDocument, spec: TableSpec): Promise<string>;
export declare function applyTable(doc: DocxDocument, op: TableOp): Promise<void>;
/** Changes the page setup ("whole document"): resolves to the new setup and the change that undoes it. */
export declare function setPage(doc: DocxDocument, asked: PageSet): Promise<PageSetResult>;
/** Changes the headers / footers ("different first page" too); resolves to them converted again and the undo. */
export declare function setHeaderFooter(doc: DocxDocument, set: HFSet): Promise<HFSetResult>;
export declare function saveDocx(doc: DocxDocument): Promise<Blob>;
export {};
