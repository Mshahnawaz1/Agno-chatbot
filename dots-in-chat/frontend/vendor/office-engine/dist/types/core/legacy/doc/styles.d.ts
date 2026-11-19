/** The stylesheet (STSH), the font table (SttbfFfn) and the list tables (PlfLst / PlfLfo) of a Word binary document. */
import { Bytes } from './bin';
import { type Chp, type Pap } from './props';
export interface Style {
    istd: number;
    sti: number;
    /** 1 paragraph, 2 character, 3 table, 4 list */
    stk: number;
    base: number;
    next: number;
    name: string;
    aliases?: string;
    id: string;
    hidden: boolean;
    papx?: Uint8Array;
    chpx?: Uint8Array;
}
/** A font of the font table */
export interface Font {
    name: string;
    alt?: string;
    charset: number;
    family: number;
    pitch: number;
}
/** Reads the font table. */
export declare function readFonts(tbl: Bytes, fc: number, lcb: number): Font[];
/** Reads the stylesheet and resolves each style's properties through its basedOn chain. */
export declare class StyleSheet {
    readonly styles: (Style | undefined)[];
    /** default fonts (ASCII, East Asian, other, complex script) */
    ftc: number[];
    private paps;
    private chps;
    private charDeltas;
    readonly root: Chp;
    constructor(tbl: Bytes, fc: number, lcb: number);
    private read;
    private readStd;
    style(istd: number): Style | undefined;
    /** a paragraph style that exists (Normal when it does not) */
    paraIstd(istd: number): number;
    /** the base style of a style, when it is of the same kind */
    baseOf(istd: number): number;
    /** resolved paragraph properties of a paragraph style */
    pap(istd: number, depth?: number): Pap;
    /** resolved character properties of a paragraph style */
    chp(istd: number, depth?: number): Chp;
    /** the character properties a character style sets (through its basedOn chain) */
    charDelta(istd: number, depth?: number): Partial<Chp> | undefined;
}
export interface Lvl {
    start: number;
    nfc: number;
    jc: number;
    legal: boolean;
    noRestart: boolean;
    follow: number;
    /** level text with placeholders as %1..%9 */
    text: string;
    restartLim: number;
    papx: Uint8Array;
    chpx: Uint8Array;
}
export interface Lst {
    lsid: number;
    simple: boolean;
    hybrid: boolean;
    istds: number[];
    lvls: Lvl[];
}
export interface Lfo {
    lsid: number;
    overrides: {
        ilvl: number;
        start?: number;
        lvl?: Lvl;
    }[];
}
/** Reads the list definitions (PlfLst) and the list instances (PlfLfo). */
export declare function readLists(tbl: Bytes, lst: {
    fc: number;
    lcb: number;
}, lfo: {
    fc: number;
    lcb: number;
}): {
    lsts: Lst[];
    lfos: Lfo[];
};
/** a Xst (length-prefixed UTF-16) or, for old tables, ANSI text */
export declare function xst(b: Bytes, p: number): string;
