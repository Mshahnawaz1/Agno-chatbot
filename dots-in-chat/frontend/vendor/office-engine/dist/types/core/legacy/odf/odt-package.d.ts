/** WordprocessingML pieces of the OpenDocument text converter: runs, notes, settings, core properties and the package. */
import { Part } from '../../iwork/ooxml';
import { type ONode } from './common';
import type { OdtMedia } from './odt-draw';
export declare const NS: string;
export declare const WML = "application/vnd.openxmlformats-officedocument.wordprocessingml";
/** collects a paragraph's runs; adjacent text with the same properties shares a run */
export declare class Runs {
    private out;
    private buf;
    private rPr;
    /** white space collapsing: the last character was a space (true at the start: leading spaces go) */
    space: boolean;
    inLink: boolean;
    text(t: string, rPr: string): void;
    raw(x: string): void;
    private flush;
    xml(): string;
}
/** puts runs at the start of the first paragraph of some blocks (a new paragraph when they start otherwise) */
export declare function prependRuns(xml: string, runs: string): string;
/** a cell, text box or note ends with a paragraph */
export declare const endWithParagraph: (xml: string) => string;
/** an ODF date (time) → W3C date time in UTC, seconds precision ('' when not one) */
export declare function isoDate(v: string): string;
/** footnotes.xml / endnotes.xml: Word's separators, then the notes */
export declare function notesXml(cls: 'footnote' | 'endnote', notes: string[]): string;
export interface SettingsOpts {
    /** default tab stop distance, points */
    tab?: number;
    background: boolean;
    evenOdd: boolean;
    /** numbering formats of the notes (undefined: the document has none) */
    footnotes?: string;
    endnotes?: string;
}
/** settings.xml */
export declare function settingsXml(o: SettingsOpts): string;
/** docProps/core.xml from the document's office:meta (undefined when it says nothing) */
export declare function coreXml(metaRoot: ONode | undefined): string | undefined;
/** a part of the package (besides document.xml) and how word/document.xml relates to it */
export interface PackPart {
    path: string;
    xml: string;
    type: string;
    /** relationship type from the document (none: referenced otherwise, e.g. headers) */
    rel?: string;
    /** the part's own relationships */
    part?: Part;
}
/** Writes the DOCX package. */
export declare function packDocx(documentXml: string, doc: Part, parts: PackPart[], media: OdtMedia, core: string | undefined): Promise<Blob>;
