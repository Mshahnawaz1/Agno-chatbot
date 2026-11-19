import { OpcPackage, type Rels } from '../opc';
import type { RNode } from '../raw';
import { type Theme } from '../theme';
import { type XEl } from '../xml';
import { Numbering } from './numbering';
import { type DocxComments } from './comments';
import { StyleSheet, type NumPr } from './styles';
import type { Block, DocxMeta, HeaderFooters, HFKind, ListMarker, PageSet, PageSetup, ParaStyle, RunSet, RunStyle, SrcRef, Table } from './types';
export type Layer = {
    ps: ParaStyle;
    rs: RunStyle;
};
export interface ParaRecord {
    layer?: Layer;
    num?: NumPr;
    ro: boolean;
    sid: string;
    lst?: 'bullet' | 'number';
    marker?: ListMarker;
}
/** run ordinal → original source (reconversion of generated XML) */
export interface GenRun {
    src?: SrcRef;
    d?: RunSet;
    /** comment threads covering the run */
    cm?: string[];
}
export interface ConvHooks {
    /** registers an editable paragraph; returns its id */
    para?(el: XEl, rec: ParaRecord): number | undefined;
    forced?: {
        pid: number;
        root: XEl;
        map: GenRun[];
        layer?: Layer;
        marker?: ListMarker;
        rec?: ParaRecord;
    };
    /** body item currently being converted (tables remember it) */
    item?: () => number;
    /** comment ranges in the body: the thread root of a w:id (undefined: not a known comment) */
    comment?(num: string | undefined): string | undefined;
    /** the number a footnote / endnote reference shows (its place among the document's notes) */
    note?(kind: 'foot' | 'end', id: string | undefined): string | undefined;
}
export declare function pageSetup(sectPr: XEl | undefined): PageSetup;
/** Runs of a paragraph in preorder (the ordinal is the run's identity for write-back). */
export declare function collectRuns(p: XEl): Map<XEl, number>;
/** Paragraphs of a body item (root included) in preorder. */
export declare function collectParas(roots: XEl[], into?: Map<XEl, number>): Map<XEl, number>;
export declare function markerOf(numbering: Numbering, num: NumPr, markRs: RunStyle): {
    marker: ListMarker;
    lst: 'bullet' | 'number';
} | undefined;
export declare class Converter {
    private styles;
    private numbering;
    private theme;
    private rels;
    private hooks;
    private fields;
    private tableLayer?;
    /** the tracked change (w:ins / w:del) the runs being read belong to */
    private tc?;
    private boxDepth;
    /** the wrapper elements (content control, smart tag…) the runs being read lie in, by number */
    private wraps;
    private wrapSeq;
    private tableDepth;
    private cur?;
    /** inlines made so far (a run that makes none is kept as an opaque one) */
    private made;
    /** runs of the paragraph being read that lie inside a field modeled as one */
    private inField;
    /** comment threads whose range is open at this point of the body, in the order they opened */
    private open;
    /** threads whose range was seen */
    readonly seen: Set<string>;
    constructor(styles: StyleSheet, numbering: Numbering, theme: Theme, rels: Rels, hooks?: ConvHooks);
    blocks(el: XEl, out: Block[]): void;
    /** a comment range opens or closes (generated paragraphs carry their marks in `forced.map` instead) */
    private rangeMark;
    /** comment threads covering what is converted now */
    private marks;
    paragraph(el: XEl, out: Block[]): void;
    /** source reference + user formatting (+ comment marks) of a run element */
    private srcOf;
    private inlines;
    private run;
    private target;
    private boxBlocks;
    private drawing;
    private vml;
    table(el: XEl): Table;
    private tableInner;
}
export interface DocxStreamCallbacks {
    onBlocks(blocks: Block[]): void;
    onMeta(meta: DocxMeta): void;
    onProgress?(loaded: number, total: number): void;
    signal?: AbortSignal;
    /** Hold blocks until this much time passed so small docs render in one go (ms). */
    initialHoldMs?: number;
}
export interface PInfo extends ParaRecord {
    item: number;
    ord: number;
}
export declare class DocxDocument {
    readonly pkg: OpcPackage;
    readonly mainPath: string;
    rels: Rels;
    readonly styles: StyleSheet;
    numbering: Numbering;
    readonly theme: Theme;
    readonly comments: DocxComments;
    /** raw XML of each body child (exact source) */
    items: string[];
    prefix: string;
    suffix: string;
    info: Map<number, PInfo>;
    /** where each original paragraph lives in the source (never changes) */
    origLoc: Map<number, {
        item: number;
        ord: number;
    }>;
    /** original paragraph id per (item, ord) */
    ordPid: Map<string, number>;
    itemParas: Map<number, number[]>;
    /** (item:ord) → paragraph ids now standing in for that original paragraph */
    groups: Map<string, number[]>;
    /** paragraphs removed with nothing in their place → the member of their group they followed (undefined: none), see applyEdit */
    gone: Map<number, number | undefined>;
    genXml: Map<number, string>;
    /** whole body items replaced by the editor (regenerated tables; '' = deleted) */
    itemXml: Map<number, string>;
    /** styles the editor changed → their definition in the file as opened (parsed, and as source) */
    styleOrig: Map<string, {
        x: XEl;
        raw: RNode;
    }>;
    /** page setup of the final section as opened, and the changes made to it (written to every section on save) */
    page: PageSetup;
    pageSet?: PageSet;
    /** w:id of the next tracked change written (high: clear of the file's own ids) */
    nextTrackId: number;
    private nextPid;
    private captured;
    private edited;
    private constructor();
    static open(pkg: OpcPackage, mainPath: string): Promise<DocxDocument>;
    get dirty(): boolean;
    markEdited(): void;
    /** relationship ids of the headers / footers shown (final section) */
    hfRefs?: Record<HFKind, string | undefined>;
    /** the parts of even pages (shown when `evenOdd`); the editor does not change them */
    evenRefs: {
        header?: string;
        footer?: string;
    };
    /** the file sets different headers / footers for odd and even pages */
    evenOdd: boolean;
    /** number format and first number of footnotes / endnotes (settings.xml; Word's defaults otherwise) */
    noteFmt: {
        foot: string;
        end: string;
    };
    noteStart: {
        foot: number;
        end: number;
    };
    private noteSeq;
    /** what a footnote / endnote reference shows: its place among the notes of the document, in the format of its kind */
    noteText: (kind: 'foot' | 'end', id: string | undefined) => string | undefined;
    /** headers / footers created by the editor: referenced from the sections on save */
    hfNew: Map<HFKind, string>;
    /** "different first page" as set by the editor (undefined: as in the file) */
    titlePgSet?: boolean;
    /** "different first page" in the file */
    titlePg: boolean;
    /** page setup or header / footer references were changed in this session (sections rebuilt on save) */
    sectTouched: boolean;
    /** the headers / footers, converted with the styles as they are now; undefined when the document has none */
    headers(): Promise<HeaderFooters | undefined>;
    private headerFooter;
    stream(cb: DocxStreamCallbacks): Promise<void>;
    get ready(): boolean;
    /** Re-converts generated paragraph XML into blocks (styles, list levels resolved by the engine). */
    reconvert(pid: number, xml: string, map: GenRun[], layer: Layer | undefined, marker?: ListMarker): {
        blocks: Block[];
        rec: ParaRecord;
    };
    /** Recomputes list markers in document order; returns changed ones. */
    recomputeMarkers(): Map<number, PInfo>;
}
