/**
 * Excel 97-2003 binary workbooks (.xls: BIFF8 in the "Workbook" stream, [MS-XLS]) → XLSX. Excel 5.0 / 95 workbooks
 * (BIFF5, the "Book" stream: 8-bit strings in the workbook's code page) too. Cells keep their values, formats and
 * formulas (decoded to formula text, with the cached results), and sheets their layout, view, page setup,
 * hyperlinks and comments. Colors are the palette's, or the full colors (theme colors with tints) that Excel 2007+
 * adds. Chart sheets become empty sheets; pictures, charts, conditional formats and data validation are left out.
 */
import type { Cfb } from '../cfb';
/** Converts the workbook in a compound file to an XLSX file. */
export declare function xlsToXlsx(cfb: Cfb): Promise<Blob>;
/** Converts a BIFF5 / BIFF8 workbook stream (the records, as some programs write them without a compound file) to an XLSX file. */
export declare function biffToXlsx(stream: Uint8Array): Promise<Blob>;
