/** Everything read from a Word binary document before it is written out: text, styles, lists, sections, notes, marks. */
import type { Cfb } from '../cfb';
import { Bytes } from './bin';
import { Drawings, type Fspa } from './art';
import { type Fib } from './fib';
import { type Sep } from './props';
import { StyleSheet, type Font, type Lfo, type Lst } from './styles';
import { DocText } from './text';
export interface Section {
    cp0: number;
    cp1: number;
    sep: Sep;
}
export interface Note {
    /** reference CP in the main text */
    ref: number;
    /** auto-numbered (else a custom mark) */
    auto: boolean;
    /** the note's text */
    cp0: number;
    cp1: number;
}
export interface Comment {
    ref: number;
    cp0: number;
    cp1: number;
    author: string;
    initials: string;
    /** the commented range, when it has one */
    start?: number;
    end?: number;
}
export interface Bookmark {
    name: string;
    start: number;
    end: number;
}
/** where each story starts in the CP space */
export interface Stories {
    ftn: number;
    hdd: number;
    atn: number;
    edn: number;
    txbx: number;
    hdrTxbx: number;
}
export declare class DocModel {
    readonly cfb: Cfb;
    readonly wd: Bytes;
    readonly tbl: Bytes;
    readonly data?: Bytes;
    readonly fib: Fib;
    readonly text: DocText;
    readonly styles: StyleSheet;
    readonly fonts: Font[];
    readonly lsts: Lst[];
    readonly lfos: Lfo[];
    readonly sections: Section[];
    readonly at: Stories;
    /** header stories: [cp0, cp1) per index (6 separators, then 6 per section) */
    readonly hdd: [number, number][];
    readonly footnotes: Note[];
    readonly endnotes: Note[];
    readonly comments: Comment[];
    readonly bookmarks: Bookmark[];
    /** revision authors */
    readonly authors: string[];
    readonly drawings?: Drawings;
    /** floating shape anchors by CP (main text and headers) */
    readonly spa: Map<number, Fspa>;
    readonly spaHdr: Map<number, Fspa>;
    /** text box stories: shape id → [cp0, cp1) */
    readonly txbx: Map<number, [number, number]>;
    readonly txbxList: [number, number][];
    readonly hdrTxbx: Map<number, [number, number]>;
    readonly hdrTxbxList: [number, number][];
    /** field types (flt) of the field begin characters, by CP */
    readonly flt: Map<number, number>;
    /** document properties (DOP) */
    readonly facingPages: boolean;
    readonly mirrorMargins: boolean;
    readonly defaultTab: number;
    constructor(cfb: Cfb);
    private plc;
    private table;
    private readSections;
    private readHeaders;
    /** a section's header / footer story: 0 even header, 1 odd header, 2 even footer, 3 odd footer, 4 first header, 5 first footer */
    headerStory(section: number, kind: number): [number, number] | undefined;
    private readNotes;
    private readComments;
    /** which story a CP is in (0 main, 1 footnotes, 2 headers, 3 comments, 4 endnotes, 5 text boxes, 6 header text boxes) */
    storyOf(cp: number): number;
    private readBookmarks;
    private readSpa;
    private readTxbx;
}
