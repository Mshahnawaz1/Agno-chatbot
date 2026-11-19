/**
 * What else in a workbook points at the cells of a sheet, besides formulas: filters, links, validations, conditional
 * formats and page breaks of the sheet itself; defined names (named ranges, print areas), tables, the anchors of
 * pictures and charts, and the cells a chart draws. All of it follows the cells when rows / columns are inserted or
 * deleted, and names the sheet as it is called when it is renamed.
 */
import type { OpcPackage } from '../opc';
/** rows or columns inserted (delta > 0) or deleted (delta < 0) at `at` */
export interface Shift {
    axis: 'row' | 'col';
    at: number;
    delta: number;
}
/** a part rewritten by an edit: its text before and after (undoing puts the first back) */
export interface PartEdit {
    path: string;
    prev: string;
    next: string;
}
/** A list of ranges (`sqref`, `ref`: space separated) after the shifts; null when none is left. */
export declare function shiftSqref(text: string, shifts: Shift[]): string | null;
/**
 * What follows `</sheetData>` in a sheet (up to and without `</worksheet>`), after rows / columns moved (`shifts`,
 * in the order they were made) and sheets were renamed (`renames`: [old, new]).
 */
export declare function followSheetTail(xml: string, shifts: Shift[], renames: [string, string][], sheetName: string): string;
/**
 * A sheet was renamed: the defined names are done with the list of sheets; here the charts that draw its cells.
 * (The validations and conditional formats of the sheets follow when they are written: `followSheetTail`.)
 */
export declare function renameInCharts(pkg: OpcPackage, from: string, to: string): Promise<PartEdit[]>;
/** a header cell to write: a table got a column */
export interface NewHeader {
    r: number;
    c: number;
    text: string;
}
/**
 * Rows / columns of sheet `sheetPath` (called `sheetName`) moved: the defined names, the tables of the sheet, the
 * anchors of its pictures and charts, and the cells any chart draws of it, follow. Returns the parts rewritten,
 * and the header cells of the columns tables got (a table names each of its columns in its first row).
 */
export declare function followParts(pkg: OpcPackage, mainPath: string, sheetPath: string, sheetName: string, s: Shift): Promise<{
    parts: PartEdit[];
    headers: NewHeader[];
}>;
/**
 * The text of a sheet part from the end of its rows on (the filters, validations, conditional formats… after
 * `</sheetData>`), read without holding the rows.
 */
export declare function sheetTail(pkg: OpcPackage, path: string): Promise<string>;
