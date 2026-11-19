import { OpcPackage, type Rels } from '../opc';
import { XlsxComments } from './comments';
import type { RowPages, SheetLoader } from './import';
import { type Theme } from '../theme';
import { Calc } from './calc';
import { type SheetStyles } from './styles';
import type { Shift } from './follow';
import type { BlockOut, CellDetail, ColInfo, FindMatch, FindOptions, Merge, RowAttrs, SheetInfo, SheetProgress, TextRun, WorkbookMeta } from './types';
export declare const T_NUM = 0;
export declare const T_SST = 1;
export declare const T_STR = 2;
export declare const T_BOOL = 3;
export declare const T_ERR = 4;
export declare const T_DATE = 5;
export declare const T_EMPTY = 6;
export { MAX_COL, MAX_ROWS } from './limits';
export declare function colIndex(letters: string): number;
export declare function colName(c: number): string;
export declare function parseRef(ref: string): [number, number];
export declare function parseRange(ref: string): Merge | undefined;
/** index in a row's entries (column, type, value, style: four slots each, by column) of the first at column `c` or after */
export declare function colAt(row: unknown[], c: number): number;
/**
 * Row `r` of a sheet, to change in place: a row a snapshot holds (`SheetData.held`) is copied first, so that what
 * the snapshot was taken of stays as it was.
 */
export declare function ownRow(d: SheetData, r: number): unknown[] | undefined;
export declare class SheetData {
    /** shared formula groups: si → master cell key + formula text */
    shared: Map<number, {
        master: number;
        text: string;
    }>;
    /** dependent cell key → shared formula si */
    depOf: Map<number, number>;
    /** array formulas: first cell key → the cells the formula fills. One only while that cell has a formula. */
    arrays: Map<number, Merge>;
    /** edited cell keys (r * MAX_COL + c) */
    edited: Set<number>;
    /** row heights in pt / hidden flags (from the file or the editor) */
    rowAttrs: Map<number, RowAttrs>;
    /** rows grown to fit a large font (no explicit height in the file): px */
    autoRowH: Map<number, number>;
    /** attributes of <sheetProtection> when the sheet is protected (`sheet="1"`) */
    protection?: Record<string, string>;
    /** whole-sheet rewrite needed (rows/cols inserted or deleted) */
    structural: boolean;
    /** sections to regenerate on save */
    dirtyCols: boolean;
    dirtyMerges: boolean;
    dirtyView: boolean;
    /** rows whose height/visibility changed */
    dirtyRows: Set<number>;
    /** rows whose cells moved as wholes (a sort): written again from the model, every cell of them */
    rewrite: Set<number>;
    /** formulas rewritten because another sheet changed */
    formulaChanged: boolean;
    /** formula cells computed anew since the sheet was read: the value the file holds for them is stale */
    revalued: Set<number>;
    /** the cells of the shared formulas have their own text in `formulas` (`expandShared`) */
    sharedExpanded: boolean;
    /** rows / columns inserted and deleted since the sheet was read, in order: what points at its cells in its XML follows when it is written */
    shifts: Shift[];
    /** sheets renamed since ([old, new]): its validations and conditional formats may name them */
    renames: [string, string][];
    /** formula cells stored without a cached value (to compute after load) */
    uncached: number[];
    /** its formulas were computed after it was read (a workbook that says to compute on load) */
    calculated: boolean;
    /** it has formulas whose value is of the moment they are computed (TODAY, NOW, RAND): computed when the file is read, as Excel does */
    clock: boolean;
    rows: (unknown[] | undefined)[];
    /** rows that snapshots (Undo of inserted / deleted rows and columns) hold as they are: see `ownRow` */
    held?: WeakSet<unknown[]>;
    /** a sheet too large for memory: its rows are read from the file by pages, those in memory being in `rows` */
    pages?: RowPages;
    maxRow: number;
    maxCol: number;
    formulas: Map<number, string>;
    merges: Merge[];
    colInfo: ColInfo[];
    defaultColW: number;
    defaultRowH: number;
    frozen: {
        rows: number;
        cols: number;
    };
    gridLines: boolean;
    done: boolean;
    error?: string;
    loading?: Promise<void>;
}
/** where formatting a workbook that has no styles part puts one */
export declare const DEFAULT_STYLES_PART = "xl/styles.xml";
/**
 * The workbook's styles part: the one its relationship names. A workbook that came without styles and was formatted
 * by a version before 0.14.2 holds them in a part no relationship names: it is read as well, or the file opens
 * without any of its formatting.
 */
export declare function stylesPartOf(pkg: OpcPackage, rels: Rels): string | undefined;
export declare class XlsxWorkbook {
    readonly pkg: OpcPackage;
    readonly mainPath: string;
    readonly rels: Rels;
    readonly sheets: SheetInfo[];
    styles: SheetStyles;
    readonly date1904: boolean;
    readonly theme: Theme;
    /** the file says its formula values are not to be trusted (`fullCalcOnLoad`): they are computed when it is read */
    readonly fullCalc: boolean;
    sheetsData: Map<number, SheetData>;
    /** the comments (read in `open`) */
    comments: XlsxComments;
    readonly calc: Calc;
    sst: string[];
    /** the shared strings that are rich text, by index: the parts with a font of their own */
    rich: Map<number, TextRun[]>;
    /** `<workbookProtection lockStructure>`: sheets cannot be added, renamed, deleted or moved */
    lockStructure: boolean;
    private sstLoading?;
    /** sheets filled from something else than their XML (a text file being imported), by sheet path: run when the sheet loads */
    readonly loaders: Map<string, SheetLoader>;
    private constructor();
    static open(pkg: OpcPackage, mainPath: string): Promise<XlsxWorkbook>;
    meta(): WorkbookMeta;
    private loadSst;
    /**
     * Streams a sheet into memory, reporting progress so the UI can grow while parsing.
     * Calling again for a loaded sheet replays its state; for a sheet still parsing (for another caller) the state is
     * reported once the parse is done — its header isn't known before, and the view keeps the first header it gets.
     */
    loadSheet(index: number, emit: (p: SheetProgress) => void, onBytes?: (phase: string, loaded: number, total: number) => void): Promise<void>;
    private stale?;
    /** told the values of a sheet changed after it was read (computed in the background): the views read its cells again */
    onValues?: (p: SheetProgress) => void;
    /**
     * Computes the formulas the file gives no value for (all of them when it says to compute on load). In one pass
     * over the workbook, every sheet read first: a formula may read any sheet, and one computed before what it reads
     * would be wrong.
     */
    private computeStale;
    /** resolves once the values being computed after reading sheets are in (`computeStale`) */
    settled(): Promise<void>;
    /** loads the sheets whose rows come from a loader (an imported text file) and are not in yet: saving writes them from the model */
    loadPending(): Promise<void>;
    private snapshot;
    /** rows [r0, r1] of a sheet in memory (a sheet whose rows are read from its file by pages); throws when they cannot all be */
    ensure(d: SheetData, r0: number, r1: number): Promise<void>;
    /** Formatted cells for rows [r0, r1). */
    block(sheet: number, r0: number, r1: number): Promise<BlockOut>;
    /**
     * The sheet as delimited text (the values as shown), a line per row of the used range less the rows and columns
     * with nothing shown at its end. A Blob: it can be larger than a string should be.
     */
    text(sheet: number, sep: string): Promise<Blob>;
    /** cells whose shown value (or formula) contains `query`, in row order */
    find(sheet: number, query: string, opts?: FindOptions, limit?: number): Promise<FindMatch[]>;
    cell(sheet: number, r: number, c: number): Promise<CellDetail | undefined>;
    unload(sheet: number): void;
}
/** pixel heights of every non-default row: explicit heights / hidden rows win over font-grown ones */
export declare function rowSizesOf(d: SheetData): [number, number][];
