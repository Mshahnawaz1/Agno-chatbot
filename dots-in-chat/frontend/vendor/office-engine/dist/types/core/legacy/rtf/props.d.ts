export type Side = 't' | 'l' | 'b' | 'r' | 'btw' | 'h' | 'v';
export interface Border {
    /** WordprocessingML border style ('single', 'double', 'nil'…) */
    style?: string;
    /** width (twips) */
    w?: number;
    /** color table index */
    cf?: number;
    /** space to the text (twips) */
    sp?: number;
}
/** pattern shading: background and foreground color indexes, foreground percentage (×100) */
export interface Shade {
    bg?: number;
    fg?: number;
    pct?: number;
}
export interface Chp {
    f?: number;
    /** East Asian font (`\dbch\afN`) */
    fEA?: number;
    /** half-points */
    fs?: number;
    b?: boolean;
    i?: boolean;
    caps?: boolean;
    scaps?: boolean;
    strike?: boolean;
    dstrike?: boolean;
    outl?: boolean;
    shad?: boolean;
    embo?: boolean;
    impr?: boolean;
    v?: boolean;
    /** underline kind (w:u values) */
    ul?: string;
    ulc?: number;
    cf?: number;
    hl?: number;
    shd?: Shade;
    va?: 'superscript' | 'subscript' | 'baseline';
    /** raised (+) / lowered (−) half-points */
    up?: number;
    /** character spacing (twips) */
    expnd?: number;
    scale?: number;
    kern?: number;
    /** character style */
    cs?: number;
    /** tracked changes: inserted / deleted text, the author (\revtbl index) and date (DTTM) of each */
    ins?: boolean;
    insA?: number;
    insD?: number;
    del?: boolean;
    delA?: number;
    delD?: number;
}
export interface Tab {
    pos: number;
    kind?: string;
    leader?: string;
}
/** legacy (Word 6/95) paragraph numbering: `{\*\pn …}` */
export interface Pn {
    /** 'blt' (bullet), 'body' (numbered), 'cont' (no number), or the outline level 1-9 */
    lvl?: string | number;
    fmt?: string;
    start?: number;
    before?: string;
    after?: string;
    f?: number;
    fs?: number;
    b?: boolean;
    i?: boolean;
    indent?: number;
}
/** a frame: a paragraph positioned on the page (\absw, \posx, \pvpg…) */
export interface Frame {
    w?: number;
    /** > 0 at least, < 0 exactly */
    h?: number;
    x?: number;
    y?: number;
    xAlign?: string;
    yAlign?: string;
    hAnchor?: string;
    vAnchor?: string;
    hSpace?: number;
    vSpace?: number;
    wrap?: string;
    lock?: boolean;
}
export interface Pap {
    s?: number;
    jc?: string;
    li?: number;
    ri?: number;
    fi?: number;
    sb?: number;
    sa?: number;
    sbauto?: boolean;
    saauto?: boolean;
    sl?: number;
    slmult?: boolean;
    keepn?: boolean;
    keep?: boolean;
    pagebb?: boolean;
    widctl?: boolean;
    contextual?: boolean;
    outline?: number;
    shd?: Shade;
    brdr?: Partial<Record<Side, Border>>;
    tabs?: Tab[];
    intbl?: boolean;
    itap?: number;
    ls?: number;
    ilvl?: number;
    pn?: Pn;
    rtl?: boolean;
    frame?: Frame;
}
export interface Font {
    name: string;
    charset?: number;
    cpg?: number;
}
/** what properties refer to: the font and color tables */
export interface Tables {
    fonts: Map<number, Font>;
    colors: (string | undefined)[];
}
export declare const colorOf: (t: Tables, idx: number | undefined) => string | undefined;
/** the highlight name of a color, when it is one of Word's highlight colors */
export declare function highlightName(hex: string | undefined): string | undefined;
/** the fill color of a pattern shading; undefined: none */
export declare function shadeFill(t: Tables, s: Shade | undefined): string | undefined;
export declare const shdXml: (fill: string | undefined) => string;
/** a border element (`tag`: top, left, insideH…) */
export declare function borderXml(t: Tables, tag: string, b: Border | undefined): string;
/** RTF border kinds → w:val */
export declare const BORDER: Record<string, string>;
/** run properties that differ between `run` and `base` (both complete: the defaults filled in) */
export declare function rPrDiff(t: Tables, run: Chp, base: Chp): string;
/** run properties a style sets itself (`own`), where they differ from its parent's (`parent`, complete) */
export declare function rPrOwn(t: Tables, own: Chp, parent: Chp): string;
/** every run property set (numbering levels) */
export declare function rPrSet(t: Tables, c: Chp): string;
export declare const tabKind: (w: string) => string;
export declare const tabLeader: (w: string) => string;
export interface PPrExtra {
    style?: string;
    numPr?: string;
    /** paragraph mark run properties */
    rPr?: string;
    sectPr?: string;
}
/** w:pPr of a paragraph (complete properties) against what its style gives (complete) */
export declare function pPrDiff(t: Tables, p: Pap, base: Pap, e?: PPrExtra): string;
/** w:ind of a numbering level */
export declare const levelInd: (p: Pap) => string;
