/**
 * The structure of a PowerPoint 97-2003 file ([MS-PPT] 2.1-2.4): the Current User stream points to the last
 * UserEditAtom of the "PowerPoint Document" stream; the chain of edits gives the persist directory (persist id →
 * stream offset, the latest edit wins), which locates the DocumentContainer, the slides, masters and notes.
 */
import type { Cfb } from '../cfb';
import { Rec } from './records';
/** a slide, master or notes page listed in the document */
export interface SlideRef {
    persistId: number;
    /** the id slides and notes use to refer to it */
    slideId: number;
    /** the record (SlideContainer, MainMasterContainer or NotesContainer) */
    rec?: Rec;
    /** text of the slide's placeholders (SlideListWithText entries after its SlidePersistAtom) */
    texts: Rec[][];
}
export interface Hyperlink {
    url?: string;
    /** a place inside the presentation ("slideId,slideIndex,title") */
    location?: string;
}
/** headers and footers settings */
export interface HeadersFooters {
    date: boolean;
    todayDate: boolean;
    userDate: boolean;
    slideNumber: boolean;
    header: boolean;
    footer: boolean;
    /** date format id (today's date) */
    format: number;
    userDateText?: string;
    headerText?: string;
    footerText?: string;
}
/** The PowerPoint Document stream and what its document record lists. */
export declare class PptDocument {
    readonly stream: Uint8Array;
    readonly persist: Map<number, number>;
    readonly doc: Rec;
    readonly slides: SlideRef[];
    readonly masters: SlideRef[];
    readonly notes: SlideRef[];
    readonly fonts: string[];
    readonly links: Map<number, Hyperlink>;
    /** slide size in master units (576 per inch) */
    readonly width: number;
    readonly height: number;
    readonly notesWidth: number;
    readonly notesHeight: number;
    readonly firstSlideNumber: number;
    /** "don't show headers and footers on the title slide" */
    readonly omitTitlePlace: boolean;
    readonly pictures?: Uint8Array;
    /** PowerPoint 2000 extras of placeholder text: StyleTextProp9Atoms by slide id, with their text type */
    readonly outline9: Map<number, {
        type: number;
        style: Rec;
    }[]>;
    private cryptRef;
    constructor(cfb: Cfb);
    /** the record a persist id points to */
    get(persistId: number): Rec | undefined;
    /** reads the persist directory; returns the document's persist id */
    private readPersist;
    private looksOld;
    /** follows the UserEditAtom chain from an offset; undefined when it does not start at an edit */
    private walkEdits;
    /** a PersistDirectoryAtom's entries, for ids not known yet (untrusted ones: only offsets inside the stream) */
    private readDirectory;
    /** a SlideListWithText: its SlidePersistAtoms with the text records after each */
    private list;
    /** the headers and footers settings of slides (instance 3) or notes (4), from a container or the document */
    headersFooters(container: Rec | undefined, inst?: number): HeadersFooters | undefined;
    /** the font name of a font index */
    font(i: number | undefined): string | undefined;
}
