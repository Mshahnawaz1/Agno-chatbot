/**
 * Other word-processing, spreadsheet and presentation formats, converted in the worker to the Office Open XML file
 * the views show and edit (saving writes that file):
 * - Word 97-2003 (.doc), Excel 97-2003 (.xls), PowerPoint 97-2003 (.ppt): binary records in a compound file
 * - Rich Text Format (.rtf)
 * - OpenDocument text, spreadsheet and presentation (.odt, .ods, .odp; also templates and flat XML .fodt / .fods / .fodp)
 */
import type { DocKind } from '../opc';
import type { ZipArchive } from '../zip';
import { type OdfFormat } from './odf';
export { isCfb } from './cfb';
export type LegacyFormat = 'doc' | 'xls' | 'ppt' | 'rtf' | OdfFormat;
/** what each format opens as */
export declare const LEGACY_KIND: Record<LegacyFormat, DocKind>;
/** extensions of the formats (with their templates and flat XML variants) */
export declare const LEGACY_EXT: Record<string, LegacyFormat>;
/** "{\rtf" */
export declare function isRtf(b: Uint8Array): boolean;
/** a flat OpenDocument file (one XML document): `<office:document` near the start */
export declare function isFlatOdf(b: Uint8Array): boolean;
/**
 * An Excel workbook stream outside a compound file (older Excel versions, some exporters): its first record is a BOF
 * (0x0809 BIFF5/8, 0x0409 BIFF4, 0x0209 BIFF3, 0x0009 BIFF2) of a plausible length
 */
export declare const isBareBiff: (b: Uint8Array) => boolean;
/** the format of a file whose first bytes are a compound file, RTF, a bare Excel stream or flat OpenDocument; null for others (ZIP packages, text) */
export declare function legacyFormatOf(head: Uint8Array): 'cfb' | 'rtf' | 'biff' | 'flat-odf' | null;
export interface Converted {
    /** the Office Open XML file */
    file: Blob;
    format: LegacyFormat;
}
/** Converts a compound file: a Word, Excel or PowerPoint 97-2003 file (also 95 and older where supported). */
export declare function convertCfb(bytes: Uint8Array): Promise<Converted>;
/** Converts an Excel workbook stream that is not inside a compound file. */
export declare function convertBiff(bytes: Uint8Array): Promise<Converted>;
/** Converts an RTF file. */
export declare function convertRtf(bytes: Uint8Array): Promise<Converted>;
/** Converts an OpenDocument package, or null when the ZIP is not one. */
export declare function convertOdfZip(zip: ZipArchive): Promise<Converted | null>;
/** Converts a flat OpenDocument file (.fodt, .fods, .fodp). */
export declare function convertFlatOdf(bytes: Uint8Array): Promise<Converted>;
