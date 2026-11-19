/**
 * Character, paragraph, table and section properties of a Word binary document, and the property modifiers
 * (sprms) that build them: a style's or a run's list of sprms applied in order onto the properties it is based on.
 */
import { Bytes } from './bin';
/** a border: line type, width (eighths of a point), color (hex or "auto"), space (pt); null = no border */
export type Brc = {
    t: number;
    w: number;
    c: string;
    sp: number;
    sh: boolean;
} | null;
/** color indices (ico) */
export declare const ICO: string[];
/** COLORREF (red, green, blue, fAuto) */
export declare function cv(b: Bytes, o: number): string;
/** Brc80 (4 bytes): width, type, ico, space / shadow */
export declare function brc80(b: Bytes, o: number): Brc;
/** Brc (8 bytes): COLORREF, width, type, space / shadow */
export declare function brc(b: Bytes, o: number): Brc;
/** the fill a shading shows ('' = none): patterns blend the foreground into the background */
export declare function shdFill(fore: string, back: string, ipat: number): string;
/** Shd80 (2 bytes): icoFore, icoBack, ipat */
export declare const shd80: (v: number) => string;
/** Shd (10 bytes): cvFore, cvBack, ipat */
export declare const shd: (b: Bytes, o: number) => string;
export interface Chp {
    istd: number;
    b: boolean;
    i: boolean;
    bCs: boolean;
    iCs: boolean;
    strike: boolean;
    dstrike: boolean;
    caps: boolean;
    smallCaps: boolean;
    vanish: boolean;
    outline: boolean;
    shadow: boolean;
    emboss: boolean;
    imprint: boolean;
    kul: number;
    color: string;
    hps: number;
    hpsBi: number;
    /** font indices: ASCII, East Asian, other (high ANSI), complex script */
    f0: number;
    f1: number;
    f2: number;
    fBi: number;
    iss: number;
    pos: number;
    space: number;
    kern: number;
    scale: number;
    hl: number;
    shd: string;
    brc: Brc;
    rtl: boolean;
    noProof: boolean;
    webHidden: boolean;
    specVanish: boolean;
    cvUl: string;
    kcd: number;
    spec: boolean;
    pic: number;
    ole2: boolean;
    obj: boolean;
    data: boolean;
    fldVanish: boolean;
    sym: number;
    symFtc: number;
    rmIns: boolean;
    rmDel: boolean;
    ibst: number;
    dttm: number;
    ibstDel: number;
    dttmDel: number;
}
export declare const DEFAULT_CHP: Chp;
/** properties that belong to one run, not to styles */
export declare const RUN_ONLY: (keyof Chp)[];
export interface Tab {
    pos: number;
    jc: number;
    tlc: number;
}
export interface Pap {
    istd: number;
    jc: number;
    keep: boolean;
    keepNext: boolean;
    pbb: boolean;
    widow: boolean;
    noLnn: boolean;
    noHyph: boolean;
    bidi: boolean;
    ctxSp: boolean;
    mirror: boolean;
    left: number;
    right: number;
    first: number;
    before: number;
    after: number;
    beforeAuto: boolean;
    afterAuto: boolean;
    line: number;
    lineMult: boolean;
    inTable: boolean;
    ttp: boolean;
    itap: number;
    innerCell: boolean;
    innerTtp: boolean;
    ilfo: number;
    ilvl: number;
    outLvl: number;
    tabs: Tab[];
    bTop: Brc;
    bLeft: Brc;
    bBottom: Brc;
    bRight: Brc;
    bBetween: Brc;
    bBar: Brc;
    shd: string;
    /** a frame (absolutely positioned paragraph): anchors (sprmPPc), position, size, wrapping, distance from text */
    pc: number;
    xAbs: number;
    yAbs: number;
    wAbs: number;
    hAbs: number;
    wr: number;
    fromX: number;
    fromY: number;
}
export declare const DEFAULT_PAP: Pap;
/** a table cell (TC) */
export interface Tc {
    /** horizontal merge: bit 0 first merged cell, bit 1 merged into the one before */
    hm: number;
    /** vertical merge: 0 none, 1 continues the cell above, 3 starts a merge */
    vm: number;
    va: number;
    vertical: boolean;
    brc: (Brc | undefined)[];
    shd?: string;
    w?: number;
    pad: (number | undefined)[];
}
export interface Tap {
    jc: number;
    gapHalf: number;
    rowH: number;
    cantSplit: boolean;
    header: boolean;
    bidi: boolean;
    centers: number[];
    tc: Tc[];
    /** top, left, bottom, right, insideH, insideV (undefined: not set) */
    brc: (Brc | undefined)[];
    widthFts: number;
    width: number;
    pad: (number | undefined)[];
    wBefore: number;
}
export interface Sep {
    bkc: number;
    titlePg: boolean;
    w: number;
    h: number;
    landscape: boolean;
    left: number;
    right: number;
    top: number;
    bottom: number;
    gutter: number;
    hdrTop: number;
    hdrBottom: number;
    cols: number;
    colSpace: number;
    evenly: boolean;
    colW: Map<number, {
        w?: number;
        sp?: number;
    }>;
    lBetween: boolean;
    pgnStart: number;
    pgnRestart: boolean;
    nfcPgn: number;
    vjc: number;
    bidi: boolean;
    rtlGutter: boolean;
    lnnMod: number;
    dxaLnn: number;
    lnc: number;
    lnnMin: number;
    pgBrc: Brc[];
    pgbProp: number;
}
export declare const defaultSep: () => Sep;
export declare const emptyTap: () => Tap;
/** Calls `fn` for each sprm of a grpprl (opcode, the bytes, the operand's offset). Stops at a truncated one. */
export declare function eachSprm(g: Uint8Array, fn: (op: number, b: Bytes, at: number) => void): void;
/** the sprm group: 1 paragraph, 2 character, 3 picture, 4 section, 5 table */
export declare const sgc: (op: number) => number;
export interface ChpContext {
    /** the paragraph style's properties (sprmCPlain) */
    para: Chp;
    /** the properties a character style sets */
    charStyle(istd: number): Partial<Chp> | undefined;
}
/**
 * Applies the character sprms of a grpprl. `c` may be partial (a style's own properties); `style` holds the values
 * toggles flip (the styles' properties).
 */
export declare function applyChp(c: Chp, g: Uint8Array, style: Chp, ctx?: ChpContext): void;
/** Applies the paragraph sprms of a grpprl. */
export declare function applyPap(a: Pap, g: Uint8Array): void;
/** Replaces sprmPHugePapx (a grpprl too long for its page, kept in the Data stream) by that grpprl. */
export declare function expandHuge(g: Uint8Array, data: Bytes | undefined): Uint8Array;
/** Applies the table sprms of a row's grpprl (the row-end paragraph's properties). */
export declare function applyTap(t: Tap, g: Uint8Array): void;
/** Applies the section sprms of a SEPX grpprl. */
export declare function applySep(s: Sep, g: Uint8Array): void;
/** Prm0 (a piece's single sprm): its isprm → sprm opcode */
export declare const PRM0: number[];
