import { type OdfPackage } from './common';
/** Converts an OpenDocument spreadsheet to a XLSX file. */
export declare function odsToXlsx(pkg: OdfPackage): Promise<Blob>;
