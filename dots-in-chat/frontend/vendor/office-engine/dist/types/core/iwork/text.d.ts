/**
 * Walks a TSWP.StorageArchive: its text split into paragraphs, each with its styles and its pieces
 * (text runs, attachments, footnote marks).
 *
 * The storage keeps one string; formatting lives in attribute tables of (character index → object) entries.
 * Indices count UTF-16 code units, like JS strings. A paragraph-style entry without object keeps the previous
 * style; a character-style entry without object ends the character style.
 */
import type { IworkPackage } from './iwa';
import type { Msg } from './proto';
export declare const STORAGE: Set<number>;
export type Seg = {
    t: 'text';
    text: string;
    charId?: number;
    href?: string;
}
/** U+FFFC: a drawable, field or other attachment object */
 | {
    t: 'att';
    id: number;
    charId?: number;
    href?: string;
}
/** a footnote mark (TSWP.FootnoteReferenceAttachmentArchive) */
 | {
    t: 'note';
    id: number;
    charId?: number;
};
export interface TextPara {
    paraId?: number;
    listId?: number;
    /** list level, 0-8 */
    level: number;
    /** a page / section break comes before it */
    pageBreak: boolean;
    segs: Seg[];
}
interface Entry {
    i: number;
    ref?: number;
}
/** the entry in force at `pos` (last one starting at or before it) */
export declare function at(list: Entry[], pos: number): Entry | undefined;
/** the section (TP.SectionArchive) in force at the start of a storage */
export declare function firstSection(s: Msg | undefined): number | undefined;
/** Paragraphs of a text storage. */
export declare function paragraphs(pkg: IworkPackage, s: Msg): TextPara[];
/** characters of a text run that have no place in the output (controls, object marks, lone surrogates) */
export declare function cleanText(t: string): string;
export {};
