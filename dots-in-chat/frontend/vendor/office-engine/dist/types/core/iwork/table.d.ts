/**
 * iWork tables (TST.TableModelArchive): the cell grid with each cell's shown value.
 * Cells live in tiles of row buffers; a cell record starts with its storage version and type, then a flag word
 * telling which values / table-list keys follow. Two layouts exist: pre-BNC (iWork '13–'14, versions 3 and 4)
 * and the current one (version 5).
 */
import { type CellKind } from './format';
import type { IworkPackage } from './iwa';
import type { Msg } from './proto';
export interface IworkCell {
    kind?: CellKind;
    /** number, boolean (0 / 1), duration (seconds) or date (seconds from 2001-01-01 UTC) */
    value?: number;
    /** TSK.FormatStructArchive of the value */
    format?: Msg;
    /** plain text shown */
    text?: string;
    /** TSWP storage of a rich text cell */
    storage?: number;
    /** cell style (TST.CellStyleArchive) and paragraph style of the text */
    cellStyle?: number;
    textStyle?: number;
    /** merged range anchored here */
    rowSpan?: number;
    colSpan?: number;
    /** covered by a merged range */
    merged?: boolean;
}
export interface IworkTable {
    rows: number;
    cols: number;
    colWidths: number[];
    rowHeights: number[];
    headerRows: number;
    headerCols: number;
    footerRows: number;
    /** hidden (by the user or a filter) */
    hiddenRows: Set<number>;
    hiddenCols: Set<number>;
    /** [row][col] */
    cells: (IworkCell | undefined)[][];
    model: Msg;
}
/**
 * Reads a TST.TableModelArchive. `texts`: the shown text of every value; without it only values an Excel number
 * format can't show (durations, fractions, other bases, checkboxes, ratings, pop-up menus) get one.
 */
export declare function readTable(pkg: IworkPackage, modelId: number, maxCells?: number, texts?: boolean): IworkTable | undefined;
/** merged ranges: the anchor [row, col] of every covered position */
export declare function anchors(t: IworkTable): ([number, number] | undefined)[][];
export interface CellStroke {
    /** rrggbb */
    color: string;
    /** pt */
    width: number;
}
/** borders and banding of a table: what each cell edge shows (null: no line) */
export interface TableLook {
    /** h[r][c]: line above row r (r = rows: below the last row), over column c */
    h: (CellStroke | null)[][];
    /** v[r][c]: line left of column c (c = cols: right of the last column), along row r */
    v: (CellStroke | null)[][];
    /** fill of every second body row */
    band?: string;
}
type Chain = (id: number | undefined) => Msg[];
/**
 * Lines and banding: the table style's (body, border and header strokes with their visibility switches), then
 * the lines set on the table itself (current files: stroke runs per row / column edge in its stroke sidecar).
 */
export declare function tableLook(pkg: IworkPackage, t: IworkTable, chain: Chain, color: (c: Msg | undefined) => string | undefined, fill: (f: Msg | undefined) => string | undefined): TableLook;
export {};
