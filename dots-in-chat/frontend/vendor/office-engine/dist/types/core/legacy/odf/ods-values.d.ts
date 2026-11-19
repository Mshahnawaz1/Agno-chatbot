/** Reading OpenDocument spreadsheet cells: dates, durations, errors, text, links; Excel's names for sheets and names. */
import { type ONode } from './common';
/** a repeat count attribute (1 when absent or not one) */
export declare const rep: (v: string | undefined) => number;
/** day count of an ISO date (and time) since `base` (ms); undefined when not one */
export declare function serial(v: string | undefined, base: number): number | undefined;
/** an ISO 8601 duration ("PT13H45M00S", "-P1DT2H") in days */
export declare function duration(v: string | undefined): number | undefined;
/** a LibreOffice error text as an Excel error */
export declare const excelError: (t: string) => string;
/** Excel sheet names: no []:*?/\, at most 31 characters, unique */
export declare function sheetName(name: string, used: Set<string>): string;
/** a defined name as Excel takes it */
export declare function definedName(name: string): string;
/** text of the paragraphs of a cell or annotation */
export declare function paragraphs(n: ONode): string[];
/** the target of the first link in a cell's paragraphs */
export declare function linkOf(n: ONode): string | undefined;
/** a cell with something to show (a value, a formula, text, a comment, a merge) */
export declare function hasContent(k: ONode): boolean;
