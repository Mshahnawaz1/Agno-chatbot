import type { DocComment } from '../comments';
import type { BookOp, CellInput, ColInfo, FindOptions, FmtPatch, Merge, Range, RowAttrs, SheetOp, SheetProgress, XlsxClip, XlsxEditResult } from './types';
import { type Snapshot } from './structure';
import { type DelimitedImport } from './import';
import { type PartEdit } from './follow';
import { SheetData, XlsxWorkbook } from './workbook';
export declare const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
type Entry = [number, unknown, number];
interface CellChange {
    key: number;
    prev: Entry | null;
    prevF?: string;
    next: Entry | null;
    nextF?: string;
}
interface LayoutState {
    merges?: Merge[];
    colInfo?: ColInfo[];
    rowAttrs?: [number, RowAttrs][];
    frozen?: {
        rows: number;
        cols: number;
    };
    gridLines?: boolean;
}
export interface Change {
    sheet: number;
    cells: CellChange[];
    range: Range;
    /** cheap layout state (merges, sizes, panes) before/after */
    lay?: {
        before: LayoutState;
        after: LayoutState;
    };
    /** whole-sheet snapshots (row/column insert/delete) */
    full?: {
        before: Snapshot;
        after: Snapshot;
    };
    /** comments the change moved or took away (inserted / deleted rows and columns): their values before / after */
    cm?: {
        before: [string, DocComment | null][];
        after: [string, DocComment | null][];
    };
    /** formulas of the other sheets the change rewrote (they read rows / columns that moved): their text before / after */
    others?: {
        sheet: number;
        key: number;
        prev: string;
        next: string;
    }[];
    /** parts rewritten with it (defined names, tables, drawings, charts following rows / columns that moved) */
    parts?: PartEdit[];
    /**
     * The rows of `range` put in another order (a sort): row `i` of the range took the cells of row `order[i]`. The
     * cells are moved, not kept here; the formulas among them, as their text was before and is after (it follows the
     * move), by cell.
     */
    sort?: {
        order: number[];
        before: [number, string][];
        after: [number, string][];
    };
    /** the format (style index) of cells before and after, by cell key; -1: no cell (the change made one to hold a format) */
    restyle?: {
        keys: Float64Array;
        before: Int32Array;
        after: Int32Array;
    };
}
export declare function getEntry(d: SheetData, r: number, c: number): Entry | null;
export declare class XlsxEditor {
    private wb;
    private undoStack;
    private redoStack;
    private styleEd?;
    private stylesPath?;
    private formulaTouched;
    constructor(wb: XlsxWorkbook);
    get dirty(): boolean;
    /**
     * Comments of sheet `path` after `n` rows / columns were inserted (n > 0) or deleted (n < 0) at `at`: they move with
     * their cell, and go with it. Returns what changed (for undo).
     */
    private shiftComments;
    /** a protected sheet refuses what `flag` of <sheetProtection> forbids (every flag used here is on unless the file says "0") */
    private denySheet;
    /** style of the cell at (r, c) as the format of a cell with no content: its row's if it has one of its own, else its column's */
    private lockStyleAt;
    private defaultStyle;
    /** a protected sheet refuses to change a locked cell of `range` (no cell in it is locked: the cell formats say so) */
    private denyLocked;
    /** what a protected sheet allows, for each operation on it */
    private guardOp;
    private sheet;
    private lastRecalc;
    /**
     * Before anything is edited: every sheet is in memory (a formula may read any, and a sheet never shown may hold
     * formulas reading the cell edited: its values are saved too), the values a file left out are computed, and the
     * cells of the shared formulas have their text (an edit records the formula a cell had).
     */
    private ready;
    private apply;
    private applyRaw;
    private record;
    /** after rows/columns moved: rebuild the dependency graph and recompute every formula */
    private recalcAll;
    setCells(sheet: number, inputs: CellInput[]): Promise<XlsxEditResult>;
    /**
     * The number format a formula typed into a cell without one takes, as Excel gives it: a date for the functions
     * that give one, the format of the cell it reads for "=A1", a date for a date moved by a number ("=A1+30").
     * Undefined: none (the General format stays).
     */
    private formulaFormat;
    /** the style table grew: stores it, re-derives its css and returns the entries added after the first `before` */
    private restyled;
    /**
     * Sheets read from their file by pages: the rows an edit touches, and the rows read by the formulas it adds or
     * whose value it changes, are in memory first (throws when they cannot all be).
     */
    private prepare;
    private styles;
    /**
     * Formats the cells of `range`. Whole columns (or the whole sheet) and whole rows take the format as their own,
     * as in Excel: the cells they have get it one by one, the rest through the column's / row's style, which a cell
     * typed there later takes. The format of every cell before and after is kept by cell (`Change.restyle`).
     */
    format(sheet: number, range: Range, patch: FmtPatch): Promise<XlsxEditResult>;
    /** gives the cells of a format change the format they had before it, or have after (a cell the change made goes with it) */
    private restyle;
    private step;
    undo(): XlsxEditResult | null;
    redo(): XlsxEditResult | null;
    /** takes the change recorded by the last operation out of the (unused) undo history */
    takeRecord(): Change | undefined;
    /** exactly undoes a recorded change (rolling back an unconfirmed operation) */
    revertRecord(ch: Change): XlsxEditResult;
    /** sets the cells / layout touched by `ch` to its `which` state, recorded as a new change */
    restoreRecord(ch: Change, which: 'prev' | 'next'): XlsxEditResult;
    /** style table sizes before an operation */
    styleMark(): Promise<Record<string, number>>;
    /** drops styles derived after `m` (the operations that used them were rolled back) */
    styleTruncate(m: Record<string, number>): Promise<void>;
    /** style index of a cell (0 when empty) */
    styleAt(sheet: number, r: number, c: number): number;
    /** current layout of a sheet (after structural edits) */
    layout(sheet: number): SheetProgress;
    private indexOf;
    private allSheets;
    sheetOp(sheet: number, op: SheetOp): Promise<XlsxEditResult>;
    /** the cells of `range` that are in the sheet: it may run to the last row / column (a whole column, the whole sheet) */
    private used;
    /**
     * The block of filled cells `range` is part of: grown on every side while the row / column next to it (corners
     * included) holds something, as Excel takes "the data around the selection". And whether its first row reads as
     * a header: text over values that are not, or bold over rows that are not. What sorting a selection sorts: whole
     * rows of the table (not the selected cells alone, which would part them from their rows), less its header.
     */
    region(sheet: number, range: Range): Promise<{
        range: Range;
        header: boolean;
    }>;
    /**
     * Clears the contents of every cell of `range` (formats stay), in one undo step. Every cell: also those of rows
     * the view has not shown yet (a whole column selected, the whole sheet).
     */
    private clear;
    /**
     * The cells of `range` as they are now, for `paste` (values, formulas, formats), and as text for other programs
     * (the values as shown, tab separated). Up to the last cell the sheet has: a whole column selected is copied
     * whole, the rows not shown yet included.
     */
    copy(sheet: number, range: Range): Promise<XlsxClip>;
    /**
     * Writes copied cells with their top left at `at`, in one undo step: values as they were, formats, formulas.
     * A copied formula reads the cells at the same distance from it as before. Cells that were cut (`moved`: they
     * are cleared where they were already): their formulas read the cells they read, and whatever read the cells
     * cut reads them where they are now.
     */
    private paste;
    /** replaces `query` in matching cells (one undo step); `at` limits it to one cell */
    replace(sheet: number, query: string, by: string, opts?: FindOptions, at?: {
        r: number;
        c: number;
    }): Promise<XlsxEditResult | null>;
    private fill;
    /**
     * Sorts the rows of `range` by column `col`, in Excel's order: numbers, then text (as it compares in formulas: by
     * letters, not by character codes; "item10" before "item2"), then FALSE and TRUE, then errors; cells without
     * anything last, in either direction. The cells are moved (see `Change.sort`), formulas reading their own row
     * with them, comments with their cells.
     */
    private sort;
    /**
     * Row `i` of `range` takes the cells row `order[i]` has in the columns of the range (the cells beside them stay);
     * the formulas of those cells are `drop` before and `put` after.
     */
    private moveRows;
    /** the comments on the cells a sort moves go with them (`at[i]`: where row `i` of the range goes) */
    private sortComments;
    bookOp(op: BookOp): Promise<XlsxEditResult>;
    private bookChanged;
    /** XML of sheets created in this session (no original to stream from) */
    private newSheets;
    /**
     * Adds a sheet after `after` holding the rows of a delimited text file (CSV / TSV): they stream into the sheet
     * when it is loaded, like a sheet's XML does. `name` defaults to the file's name.
     */
    importText(after: number, imp: DelimitedImport, name?: string): Promise<XlsxEditResult>;
    save(): Promise<Blob>;
    /**
     * A workbook that came without a styles part gets one when it is formatted: the workbook has to name it
     * (relationship + content type), or nothing that opens the saved file finds its formatting. Also links the part a
     * version before 0.14.2 left unnamed.
     */
    private linkStyles;
    /** Streams the original sheet XML, patching only rows that contain edits. */
    private rewrite;
}
export {};
