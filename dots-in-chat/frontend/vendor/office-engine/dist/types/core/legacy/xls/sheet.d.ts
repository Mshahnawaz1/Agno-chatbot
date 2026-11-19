import type { FormulaEnv } from './formula';
import type { Palette, XlsxStyles } from './styles';
/** columns of an XLSX sheet */
export declare const MAX_COL = 16384;
/** cell kinds */
export declare const NUM = 0;
export declare const SST = 1;
export declare const STR = 2;
export declare const BOOL = 3;
export declare const ERR = 4;
export declare const BLANK = 5;
export declare const FORMULA = 6;
export declare const RICH = 7;
/** a formula cell: its tokens and the value Excel computed */
export interface FormulaCell {
    rgce: Uint8Array;
    extra?: Uint8Array;
    /** 0 number, 1 string, 2 boolean, 3 error, 4 empty string */
    kind: number;
    value: number | string;
}
export interface SharedFormula {
    r1: number;
    r2: number;
    c1: number;
    c2: number;
    rgce: Uint8Array;
    extra?: Uint8Array;
}
export interface RowInfo {
    ht?: number;
    custom: boolean;
    hidden: boolean;
    level: number;
    collapsed: boolean;
    xf?: number;
}
export interface ColInfo {
    first: number;
    last: number;
    width: number;
    xf: number;
    hidden: boolean;
    level: number;
    collapsed: boolean;
}
export interface Link {
    ref: string;
    target?: string;
    location?: string;
    display?: string;
    tooltip?: string;
}
export interface Note {
    r: number;
    c: number;
    author: string;
    text: string;
    show: boolean;
}
/** what the workbook gives every sheet */
export interface SheetEnv {
    biff: 5 | 8;
    styles: XlsxStyles;
    palette: Palette;
    formulas: FormulaEnv;
    /** the index of a string in the shared strings (added when new) */
    string(text: string, runs?: number[]): number;
    /** the number of strings in the BIFF SST */
    sstCount: number;
    text8(b: Uint8Array): string;
}
/** a worksheet as read */
export interface SheetModel {
    /** cells in the order read: row, column, XF, kind, value */
    cr: number[];
    cc: number[];
    cx: number[];
    ck: number[];
    cv: unknown[];
    /** the cells are in row, then column order */
    sorted: boolean;
    rows: Map<number, RowInfo>;
    cols: ColInfo[];
    /** merged ranges: first row, last row, first column, last column */
    merges: number[];
    /** SHRFMLA / ARRAY records by their first cell (and the cell before them) */
    shared: Map<number, SharedFormula>;
    arrays: Map<number, SharedFormula>;
    links: Link[];
    notes: Note[];
    defColWidth?: number;
    stdWidth?: number;
    defRowHeight?: number;
    defRowFlags: number;
    window2?: number;
    topRow: number;
    leftCol: number;
    /** PANE: columns, rows (or twips when split), top row, left column */
    pane?: number[];
    zoom?: number;
    tabColor?: string;
    wsBool: number;
    margins: Record<string, number>;
    setup?: Uint8Array;
    header: string;
    footer: string;
    printGrid: boolean;
    printHeadings: boolean;
    hCenter: boolean;
    vCenter: boolean;
    protect: boolean;
    password: number;
    rowBreaks: number[];
    colBreaks: number[];
    /** AutoFilter buttons are shown (the range is the sheet's _FilterDatabase name) */
    autoFilter: boolean;
}
/** column letters, cached */
export declare const col: (c: number) => string;
/** Reads a worksheet substream from `start` (its BOF). */
export declare function readSheet(env: SheetEnv, data: Uint8Array, start: number): SheetModel;
