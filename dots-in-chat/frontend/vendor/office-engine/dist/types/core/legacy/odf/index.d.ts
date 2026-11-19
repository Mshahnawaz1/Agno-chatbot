/** OpenDocument (ODF 1.0-1.3) text, spreadsheet and presentation files → DOCX, XLSX, PPTX. */
import type { ZipArchive } from '../../zip';
export type OdfFormat = 'odt' | 'ods' | 'odp';
/**
 * The format of an OpenDocument package (its `mimetype` entry or manifest) or flat XML document
 * (`office:mimetype`), templates included; null when it is not a text, spreadsheet or presentation.
 */
export declare function odfFormatOf(src: ZipArchive | string): Promise<OdfFormat | null>;
/** Converts an OpenDocument package (ZIP) or flat XML document to the Office Open XML file it opens as. */
export declare function odfToOoxml(src: ZipArchive | string, format: OdfFormat): Promise<Blob>;
