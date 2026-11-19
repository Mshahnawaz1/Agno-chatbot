import { type Link, type Note, type SheetEnv, type SheetModel } from './sheet';
export declare const XML_HEAD = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n";
export interface SheetOut {
    xml: string[];
    links: Link[];
    notes: Note[];
    /** the sheet's tab is selected */
    selected: boolean;
    /** formulas without a computed value were written */
    uncached?: boolean;
}
/** XLSX string escaping: control characters as _xHHHH_ (and a literal "_xHHHH_" kept as text) */
export declare function xstr(s: string): string;
/** extra sheet settings found in the workbook globals */
export interface SheetExtra {
    /** the range of the sheet's AutoFilter (its _FilterDatabase name) */
    autoFilter?: string;
}
/** Writes the worksheet part of a sheet (`index`: its position, for formulas naming sheet-level names). */
export declare function sheetXml(env: SheetEnv, m: SheetModel, index: number, extra?: SheetExtra): SheetOut;
