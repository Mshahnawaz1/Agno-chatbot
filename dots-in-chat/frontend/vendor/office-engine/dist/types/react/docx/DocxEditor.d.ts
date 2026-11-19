import type { Block, CanonStyle, HeaderFooters, HFSet, HFSetResult, PageSet, PageSetResult, PageSetup, Paragraph, ParaDirty, ParaStyle, RunSet, RunStyle, StyleInfo, Table } from '../../core/docx/types';
import type { DocumentClient } from '../../core/worker/client';
import { RichInput, type ReplaceOpts, type RichHost } from '../edit/input';
import { type BorderPreset, type CellRect } from './tables';
import { type Pos, type RRun, type Sel } from '../edit/rich';
/** a place in a paragraph that survives edits elsewhere: paragraph id, page-break part, offset */
export interface ParaPos {
    pid: number;
    k: number;
    o: number;
}
/** what a new comment would cover */
export interface CommentRange {
    a: ParaPos;
    f: ParaPos;
    /** the text covered */
    quote: string;
}
/** where a comment thread is in the document */
export interface CommentPlace {
    /** first paragraph (block address) holding its text, and the offset there */
    pa: string;
    o: number;
    /** the text it covers (paragraphs joined by spaces), shortened */
    quote: string;
}
export interface DocState {
    blocks: Block[];
    heights: WeakMap<Block, number>;
    dirty: Set<Block>;
    /** leading blocks measured at least once */
    frontier: number;
}
export interface FormatState {
    b: boolean;
    i: boolean;
    u: boolean;
    strike: boolean;
    color?: string;
    hl?: string;
    sz?: number;
    font?: string;
    align?: string;
    style?: string;
    lst?: 'bullet' | 'number';
    line?: number;
    va?: 'sup' | 'sub';
    link?: string;
    /** caret inside a table cell */
    inTable: boolean;
    /** edits are tracked; the caret / selection touches a tracked change */
    tracking?: boolean;
    inChange?: boolean;
    /** table cells the selection covers (more than one: they can be merged); the caret's cell is merged */
    cells?: {
        n: number;
        merged: boolean;
        shd?: string;
        vAlign?: string;
    };
    /** a single image is selected */
    img?: {
        w: number;
        h: number;
        alt?: string;
        target: string;
        pa: string;
        o: number;
    };
    canUndo: boolean;
    canRedo: boolean;
}
/** a model change: contiguous paragraphs replaced, or top-level blocks replaced */
export type DocxCommit = {
    kind: 'paras';
    before: Paragraph[];
    next: Paragraph[];
} | {
    kind: 'blocks';
    bi: number;
    before: Block[];
    next: Block[];
};
export declare class DocxEditor implements RichHost<Paragraph> {
    private client;
    private st;
    private changed;
    readonly input: RichInput;
    private pendSel;
    /** the caret the last edit asked for, until the view shows it (the input takes it as the selection meanwhile) */
    get pendingSel(): Sel | null;
    set pendingSel(sel: Sel | null);
    styles: StyleInfo[];
    private history;
    private future;
    private pend;
    /** next id for new paragraphs / tables (a collaboration session gives each client its own range) */
    nextPid: number;
    private inflight;
    /** paragraphs whose look on screen may be behind their style / list: a conversion was asked, none was applied yet */
    private stale;
    onState?: (s: FormatState | null) => void;
    /** image selection changed (overlay with resize handles) */
    onImage?: (img: FormatState['img'] | null) => void;
    /** style list changed (a built-in style was added to the document, a style got another look) */
    onStyles?: (styles: StyleInfo[]) => void;
    /** headers / footers were converted again (a style they use got another look) */
    onHeaders?: (h: HeaderFooters) => void;
    shortcut?: (e: KeyboardEvent) => boolean;
    onDirty?: () => void;
    /** paint format: run formatting copied from the caret, applied to the next selection */
    painter: RunSet | null;
    onPainter?: (on: boolean) => void;
    /** every model change, after it was mirrored to the worker (collaboration hook) */
    onCommit?: (c: DocxCommit) => void;
    constructor(client: DocumentClient, st: DocState, changed: () => void);
    private container;
    para(pa: string): Paragraph | undefined;
    span(a: string, b: string): string[] | null;
    prev(pa: string): string | undefined;
    next(pa: string): string | undefined;
    cmp(a: string, b: string): number;
    /** the whole document: from the first to the last editable top-level paragraph */
    all(): Sel | null;
    selectAll(): void;
    /** Deletes a top-level range that spans tables: the end paragraphs are joined, everything between goes (section breaks stay). */
    deleteAcross(s: Pos, e: Pos): Pos | null;
    withRuns(p: Paragraph, runs: RRun[]): Paragraph;
    private origOf;
    defaultRun(p: Paragraph): Partial<RRun> | undefined;
    split(p: Paragraph, left: RRun[], right: RRun[], atEnd: boolean): [Paragraph, Paragraph];
    join(a: Paragraph, b: Paragraph, runs: RRun[]): Paragraph;
    private splice;
    replace(pas: string[], next: Paragraph[], sel: Sel, opts?: ReplaceOpts & {
        history?: boolean;
        want?: boolean;
    }): void;
    /**
     * Puts `p`, a paragraph `replace` removed on its own, back at address `pa`, where no paragraph next to it can place
     * it (tables on both sides, an emptied cell). Only to revert that removal (a collaboration rebase): no history
     * entry, no commit event. The engine puts it back where it stood.
     */
    restore(pa: string, p: Paragraph): void;
    /** contiguous blocks sharing `pid` around index `near` */
    private partsOf;
    private commit;
    get busy(): boolean;
    /**
     * Paragraphs still written as they were read (with the comment marks of the file) that hold text of threads `ids`
     * are written from the model from now on: each marks its own part of the range, which saving joins into one.
     */
    private remark;
    private paraPos;
    /** the block address and offset of `d` now; null when its paragraph is gone */
    posOf(d: ParaPos): Pos | null;
    /** what a new comment covers: the selection, or the word at the caret; null when there is no text there */
    commentRange(sel?: Sel | null): CommentRange | null;
    /** marks `range` as covered by comment thread `id` (one undo step); false when its text is gone */
    markComment(id: string, range: CommentRange): boolean;
    /** the first place of each comment thread the document marks, in document order */
    commentPlaces(): Map<string, CommentPlace>;
    private locate;
    private put;
    private applyResult;
    /** current address of the first block of `list` (paragraphs by pid, tables by identity), `empty` for an empty list; undefined when gone */
    private whereNow;
    /** table undo / redo: paragraphs still in place keep their current text (edited since, maybe by collaborators) */
    private keepCurrent;
    undo(): void;
    redo(): void;
    /** undo / redo of an entry that only changed a style: it moves to the other stack, the toolbar follows */
    private styleOnly;
    get canUndo(): boolean;
    get canRedo(): boolean;
    pendingStyle(): Partial<RRun> | undefined;
    clearPending(): void;
    private selectedParas;
    format(s: Partial<RunStyle>, d: RunSet, opts?: {
        want?: boolean;
    }): void;
    toggle(key: 'b' | 'i' | 'u' | 'strike'): void;
    setFont(name: string): void;
    setSize(sz: number): void;
    setColor(c: string | null): void;
    setHighlight(c: string | null): void;
    clearFormat(): void;
    setPara(patch: ParaDirty, optimistic?: Partial<ParaStyle>, sel?: Sel | null): void;
    toggleList(kind: 'bullet' | 'number'): void;
    indent(dir: 1 | -1, sel?: Sel | null): void;
    tab(sel: Sel, shift: boolean): boolean;
    backspaceAtStart(pa: string, p: Paragraph): boolean;
    /** Enter in an empty list item goes one level out, and at the first level ends the list (Word, Docs) */
    enterAtEmpty(pa: string, p: Paragraph): boolean;
    /** ArrowRight after the last character of a table leaves it, as ArrowDown does */
    arrow(sel: Sel, dir: 1 | -1): boolean;
    /**
     * Copy / cut of text: the clipboard gets the paragraphs as the model has them (list items, headings, runs), not the
     * page's DOM (which holds the list markers as text and the colors as computed). Pictures and ranges across a table are
     * left to the browser.
     */
    copy(sel: Sel, data: DataTransfer, cut: boolean): boolean;
    /** content width (pt) of the page, for sizing new tables / images */
    contentW: number;
    /** document default font (CSS) / size, shown when a run inherits them */
    defaultFont?: string;
    defaultSz?: number;
    private prevParaPid;
    private commitTable;
    private send;
    /** Replaces top-level blocks (table insert/delete/restructure) with history + write-back. */
    replaceBlocks(bi: number, count: number, next: Block[], sel: Sel | null, history?: boolean): void;
    private emptyPara;
    insertTable(rowsN: number, colsN: number): void;
    /** Structural table edit at the caret's cell. */
    tableOp(kind: 'rowAbove' | 'rowBelow' | 'colLeft' | 'colRight' | 'delRow' | 'delCol' | 'delTable'): void;
    /** The cells the selection covers (a caret in a cell: that cell), grown to whole merged cells. */
    cellRange(sel?: Sel | null): {
        bi: number;
        t: Table;
        rect: CellRect;
        cells: number;
    } | null;
    /** replaces the table of a cell range, caret in the range's top-left cell */
    private putTable;
    /** Merges the selected cells, or splits the merged cell at the caret. */
    mergeCells(): boolean;
    unmergeCell(): boolean;
    /** Borders of the selected cells; `css` is the line drawn ('0.5pt solid #000000'). */
    setCellBorders(preset: BorderPreset, css?: string): void;
    /** Fill of the selected cells (null: no fill). */
    setCellShade(color: string | null): void;
    setCellVAlign(v: 'top' | 'middle' | 'bottom'): void;
    /** Makes the selected columns (one cell selected: every column) the same width. */
    distributeColumns(): void;
    /** Column widths of a table (pt), e.g. after dragging a column edge. */
    setColumnWidths(bi: number, cols: number[]): void;
    insertImages(files: Blob[], at?: Sel): Promise<void>;
    /** `at`: the selection the link is for (the dialog takes the focus, and the page's selection may not be known by then) */
    setLink(url: string | null, at?: Sel | null): Promise<void>;
    /** applies `fn` to the text runs inside the selection; `caret`: the selection afterwards */
    private patchRuns;
    insertPageBreak(): void;
    /** scales the selected image (factor) or fits it to the page width */
    resizeImage(f: number | 'fit'): void;
    private patchObjects;
    pasteRich(sel: Sel, data: DataTransfer): boolean;
    /** links the document takes and pictures it stores, for every run of the pasted paragraphs (cells too) */
    private resolvePasted;
    private pasteItems;
    private pasteParas;
    /** a table in place of the paragraph at the caret (split there); the caret after it, or null when nothing was pasted */
    private pasteTable;
    /** applies a built-in style (Title, Heading 1…), creating it in the document when missing */
    applyCanon(kind: CanonStyle): Promise<void>;
    /** id of a built-in style, added to the document when it lacks it; undefined when it could not be */
    private canonId;
    /** style call answers already taken in (a shared session hands the same answer to the caller and to its adapter) */
    private taken;
    /** counts the looks given to styles; style id → the count when it last got one */
    private styleGen;
    private changedAt;
    /** paragraph → the count its look was computed at (absent: when the document was read) */
    private lookAt;
    private passing;
    /** paragraph → the one that took its place when it was converted again (same content, the look of the styles by then) */
    private heir;
    /** `p` as it stands now: converted again or not, the same paragraph as long as nobody edited it */
    private latest;
    /** takes in the answer of a style call: the picker's list and, when styles look different now, what shows them */
    styled(res: {
        styles: StyleInfo[];
        changed?: string[];
        headers?: HeaderFooters;
    }): void;
    /** the page setup changed (here or by a collaborator) */
    onPage?: (page: PageSetup) => void;
    /** the page setup as last changed in this session (undefined: as in the file) */
    pageNow?: PageSetup;
    paged(res: PageSetResult): void;
    /** Changes the page setup of the whole document (size, orientation, margins, columns); undoable. */
    setPage(set: PageSet): Promise<PageSetResult | undefined>;
    /** edits are recorded as tracked changes ("suggesting") */
    tracking: boolean;
    /** the name tracked changes made here are signed with */
    author: () => string;
    onTracking?: (on: boolean) => void;
    setTracking(on: boolean): void;
    /** every editable paragraph, top level and in table cells, with its address */
    private allParas;
    /** how many tracked changes the document holds (runs of inserted / deleted text) */
    changeCount(): number;
    /**
     * Accepts (or rejects) the tracked changes in the selection — the change at the caret when nothing is selected —
     * or all of them. Undoable.
     */
    review(accept: boolean, all?: boolean): number;
    /** Selects the next (or previous) tracked change after the caret; false when there is none. */
    gotoChange(dir: 1 | -1): boolean;
    /** the headers / footers changed (here or by a collaborator) */
    onHF?: (r: {
        headers: HeaderFooters;
        titlePg: boolean;
    }) => void;
    /** headers / footers as last changed in this session (undefined: as in the file) */
    hfNow?: {
        headers: HeaderFooters;
        titlePg: boolean;
    };
    hfed(res: HFSetResult): void;
    /** Changes the headers / footers (text, page numbers, different first page); undoable. */
    setHeaderFooter(set: HFSet): Promise<HFSetResult | undefined>;
    private rehf;
    private repage;
    private setStyle;
    /** undo / redo of a style's look */
    private restyle;
    /**
     * "Update style to match": the paragraph style takes the look of the selection (font, size, colour, bold, italic,
     * underline, strikethrough; alignment, line and paragraph spacing), the selected paragraphs get the style, and
     * every paragraph of the style follows. Written to this document's styles only.
     * `target`: a style id, or `@kind` for a built-in style the document may not have yet.
     * Resolves to whether the style looks different now (undefined: there was nothing to take a look from).
     */
    updateStyle(target: string): Promise<boolean | undefined>;
    /** a paragraph whose style got another look after its own look was computed */
    private behind;
    /** every paragraph with an id, in document order (those of table cells too), the parts a page break splits it in together */
    private groups;
    /** shows the paragraphs whose style got another look with it (those a collaborator sends may still have the old one) */
    private catchUp;
    /** converts the paragraphs behind their style again, a slice at a time, and gives them the look that comes back */
    private pass;
    /** selects the inline object at (pa, o) */
    selectObject(pa: string, o: number): void;
    private imageSel;
    private patchImage;
    /** exact size in pt */
    setImageSize(w: number, h: number): void;
    /** natural pixel size of the picture → pt, limited to the text width */
    imageOriginal(nw: number, nh: number): void;
    setAltText(alt: string): void;
    replaceImage(file: Blob): Promise<void>;
    /** deletes the selection (or the selected object) */
    deleteSelection(): void;
    insertText(text: string): void;
    /** copies the caret's character formatting; the next selection receives it */
    copyFormat(): void;
    /** applies the copied formatting to the current selection (after the mouse is released) */
    applyPainter(): boolean;
    state(sel?: Sel | null): FormatState | null;
    private cellState;
    private emitState;
    onSelection(sel: Sel | null): void;
    /** table cells covered by a selection that spans more than one cell get a tint */
    private markCells;
}
