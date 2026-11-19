/**
 * The text of a Word binary document: the piece table (Clx) maps character positions (CPs) to file offsets (FCs) of
 * 8-bit or UTF-16 text; the formatted disk pages (FKPs) hold the character (CHPX) and paragraph (PAPX) properties of
 * FC ranges.
 */
import { Bytes } from './bin';
import type { Fib } from './fib';
export interface Piece {
    cp0: number;
    cp1: number;
    /** byte offset of the text in the WordDocument stream */
    fc: number;
    /** 1 byte per character (cp1252) instead of 2 (UTF-16) */
    comp: boolean;
    /** the piece's own sprms (Prm) */
    prm: Uint8Array;
}
/** a range of characters with the same CHPX and piece */
export interface Seg {
    cp0: number;
    cp1: number;
    chpx: Uint8Array;
    prm: Uint8Array;
    /** cache key of the formatting */
    key: string;
}
export declare class DocText {
    readonly pieces: Piece[];
    private pieceStarts;
    readonly text: string;
    private chpx;
    private chpxStarts;
    private papx;
    private papxStarts;
    constructor(wd: Bytes, tbl: Bytes, fib: Fib);
    private readPieces;
    private readFkps;
    get length(): number;
    pieceIndex(cp: number): number;
    /** the file offset of a character, and its piece */
    fcOf(cp: number): {
        fc: number;
        piece?: Piece;
    };
    /** paragraph properties (style, grpprl, the piece's sprms) of the paragraph whose mark is at `cp` */
    papAt(cp: number): {
        istd: number;
        g: Uint8Array;
        prm: Uint8Array;
    };
    /** the character formatting ranges of [cp0, cp1) */
    segs(cp0: number, cp1: number): Seg[];
}
