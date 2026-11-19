/** Cells as text on the clipboard: tab separated, a line per row, as spreadsheet programs write and read them. */
/** a cell written for other programs: quoted when it holds what separates cells and rows there */
export declare const tsvCell: (s: string) => string;
/**
 * The rows of cells of clipboard text. A cell holding line breaks or tabs comes quoted (Excel, Google Sheets,
 * LibreOffice all do it), its own quotes doubled: read as one cell, not as the start of the next rows.
 */
export declare function parseTsv(raw: string): string[][];
