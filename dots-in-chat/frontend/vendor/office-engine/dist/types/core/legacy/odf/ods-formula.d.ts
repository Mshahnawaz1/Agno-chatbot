/** Excel's name of an ODF function name, with the prefix XLSX stores it with */
export declare function excelFunction(name: string): string;
/** a sheet name as a formula writes it: quoted unless a plain word that isn't a cell reference */
export declare function quoteSheet(name: string): string;
/**
 * An ODF reference (the inside of `[…]`, or a cell-range-address) in Excel syntax; `sheetName` maps the sheet
 * names (renamed for Excel). '#REF!' when it cannot be (another document, deleted).
 */
export declare function excelRef(ref: string, sheetName?: (s: string) => string): string;
/**
 * An OpenFormula formula in Excel syntax (no leading "="); undefined when it isn't one we can read.
 * `sheetName` maps sheet names (some are renamed to fit Excel's rules).
 */
export declare function excelFormula(src: string, sheetName?: (s: string) => string): string | undefined;
/** a cell-range-address ("$Sheet1.$A$1:.$B$5", "Sheet1.A1:Sheet1.B5") as its sheet and Excel range ("A1:B5"); undefined when not on one sheet */
export declare function rangeOnSheet(addr: string): {
    sheet?: string;
    range: string;
} | undefined;
/** a list of cell-range-addresses separated by spaces (sheet names in quotes may hold spaces) */
export declare function rangeList(s: string): string[];
