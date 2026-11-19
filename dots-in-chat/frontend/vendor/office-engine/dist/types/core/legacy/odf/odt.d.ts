import { type OdfPackage } from './common';
/** Converts an OpenDocument text document to a DOCX file. */
export declare function odtToDocx(pkg: OdfPackage): Promise<Blob>;
