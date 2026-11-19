import type { ColInfo, Merge, Range, RowAttrs } from './types';
import type { Shift } from './follow';
import { type SheetData } from './workbook';
export interface Snapshot {
    rows: (unknown[] | undefined)[];
    formulas: Map<number, string>;
    arrays: Map<number, Merge>;
    shifts: Shift[];
    merges: Merge[];
    colInfo: ColInfo[];
    rowAttrs: Map<number, RowAttrs>;
    autoRowH: Map<number, number>;
    maxRow: number;
    maxCol: number;
    frozen: {
        rows: number;
        cols: number;
    };
}
/**
 * The state of a sheet, to go back to. The rows are the sheet's own, not copies (a sheet of 300 000 rows was copied
 * twice per inserted row, for Undo): they are marked as held, and what changes a row in place copies a held one
 * first (`ownRow`).
 */
export declare function snapshot(d: SheetData): Snapshot;
export declare function restore(d: SheetData, s: Snapshot): void;
/**
 * The cells of the shared formulas each get their own text in `formulas` (in the file only the first cell of a group
 * has it): what computes, fills, sorts or rewrites formulas sees them all. The groups stay known, so that a cell
 * nothing edited is saved as it was. Done once per sheet, before anything edits it: later a cell without a formula
 * is one the user took it from.
 */
export declare function expandShared(d: SheetData): void;
/** formula of a cell, that of a shared formula's cell included (not expanded yet), without its "=" */
export declare function formulaAt(d: SheetData, key: number): string | undefined;
/** shared formulas → explicit per-cell formulas, the groups forgotten (before rows/cols move: every cell is written anew) */
export declare function materializeShared(d: SheetData): void;
/**
 * Whether inserting `n` rows / columns at `at` would push cells that hold something off the sheet (Excel refuses
 * then too). Cells that only hold a format do not count: they fall off.
 */
export declare function overflows(d: SheetData, axis: 'row' | 'col', at: number, n: number): boolean;
/** a formula of another sheet rewritten because rows / columns moved in the sheet it reads */
export interface FormulaEdit {
    d: SheetData;
    key: number;
    prev: string;
    next: string;
}
/**
 * Moves rows or columns; delta > 0 inserts at `at`, delta < 0 deletes -delta starting at `at`. What an insert pushes
 * past the last row / column is dropped (the caller checks `overflows` first). Returns the formulas of the other
 * sheets it rewrote: undoing puts them back.
 */
export declare function shiftSheet(d: SheetData, sheetName: string, axis: 'row' | 'col', at: number, delta: number, others: {
    name: string;
    d: SheetData;
}[]): FormulaEdit[];
/** gives a formula cell another text (a reference in it moved, its sheet was renamed…): saved with the sheet */
export declare function setFormula(d: SheetData, key: number, text: string): void;
export declare function setMerge(d: SheetData, range: Range, merge: boolean): void;
export declare function setColWidth(d: SheetData, c0: number, c1: number, px: number): void;
/** gives columns c0..c1 the format `style` makes of the one they have (0: none), keeping their widths */
export declare function setColStyle(d: SheetData, c0: number, c1: number, style: (st: number) => number): void;
export declare function setRowHeight(d: SheetData, r0: number, r1: number, px: number): void;
