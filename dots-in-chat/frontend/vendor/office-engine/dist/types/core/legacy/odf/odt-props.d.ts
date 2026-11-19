import { type ONode } from './common';
export declare const XML_HEAD = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n";
/** points → twentieths of a point */
export declare const tw: (pt: number) => number;
/** points → EMUs */
export declare const emu: (pt: number) => number;
/** run properties in WordprocessingML terms (sizes and lengths in points) */
export interface RP {
    font?: string;
    fontEa?: string;
    fontCs?: string;
    b?: boolean;
    bCs?: boolean;
    i?: boolean;
    iCs?: boolean;
    caps?: boolean;
    smallCaps?: boolean;
    strike?: boolean;
    dstrike?: boolean;
    outline?: boolean;
    shadow?: boolean;
    emboss?: boolean;
    imprint?: boolean;
    vanish?: boolean;
    /** RRGGBB or 'auto' */
    color?: string;
    spacing?: number;
    /** horizontal scale, percent */
    w?: number;
    /** raised (+) or lowered (-) by points */
    position?: number;
    sz?: number;
    szCs?: number;
    /** w:u value */
    u?: string;
    uColor?: string;
    /** character border (one for all sides) */
    bdr?: Bdr;
    /** RRGGBB, or 'auto' for none */
    shd?: string;
    va?: 'superscript' | 'subscript' | 'baseline';
    lang?: string;
    langEa?: string;
    langCs?: string;
}
/** a font size: absolute, or a percentage of `base` */
export declare function fontSize(v: string | undefined, base: number): number | undefined;
/**
 * The run properties a `style:text-properties` element sets. `base` is the font size a percentage size is relative to;
 * `font` resolves a style:font-name to its family.
 */
export declare function textProps(el: ONode | undefined, base: number, font: (name: string | undefined) => string | undefined): RP;
/** w:rPr of run properties (elements in schema order); '' when there is nothing to say */
export declare function rPrXml(r: RP, rStyle?: string): string;
/** a WordprocessingML border: w:val 'nil' for none; sz in eighths of a point */
export interface Bdr {
    val: string;
    sz: number;
    color: string;
    space: number;
}
/** an fo:border value ("0.5pt solid #000000", "none"); `lineWidth` is style:border-line-width for double lines */
export declare function border(v: string | undefined, lineWidth?: string, pad?: number): Bdr | undefined;
export type Side = 'top' | 'left' | 'bottom' | 'right';
export declare const SIDES: Side[];
/** the four borders (and paddings) an element's fo:border / fo:border-* / fo:padding attributes set */
export declare function borders(a: Record<string, string>): {
    bdr: Partial<Record<Side, Bdr>>;
    pad: Partial<Record<Side, number>>;
};
export declare const bdrXml: (tag: string, b: Bdr) => string;
export interface Tab {
    val: 'left' | 'center' | 'right' | 'decimal' | 'clear';
    /** points from the paragraph's left indent */
    pos: number;
    leader?: string;
}
/** paragraph properties in WordprocessingML terms (lengths in points) */
export interface PP {
    keepNext?: boolean;
    keepLines?: boolean;
    pbb?: boolean;
    widow?: boolean;
    bdr?: Partial<Record<Side, Bdr>>;
    shd?: string;
    /** tab stops (replacing the inherited ones) */
    tabs?: Tab[];
    before?: number;
    after?: number;
    line?: {
        v: number;
        rule: 'auto' | 'exact' | 'atLeast';
    };
    /** style:line-spacing: leading added to the normal line height */
    leading?: number;
    left?: number;
    right?: number;
    /** first line indent; negative: hanging */
    first?: number;
    contextual?: boolean;
    jc?: string;
    bidi?: boolean;
    outline?: number;
    breakBefore?: 'column';
    breakAfter?: 'page' | 'column';
    pageNumber?: number;
}
/** The paragraph properties a `style:paragraph-properties` element sets. */
export declare function paraProps(el: ONode | undefined): PP;
/** merges paragraph properties: later ones win (borders side by side) */
export declare function mergePP(...list: PP[]): PP;
export interface PPExtra {
    style?: string;
    numPr?: string;
    /** replaces the indent (list paragraphs) */
    ind?: {
        left: number;
        hanging?: number;
        first?: number;
    };
    /** tab stops of the paragraph style chain the paragraph's own replace (cleared) */
    inheritedTabs?: Tab[];
    /** left indent tab stop positions are relative to; undefined: positions are from the margin */
    tabBase?: number;
    /** font size, to turn style:line-spacing into a line height */
    sz?: number;
    outline?: number;
    markRPr?: string;
    sectPr?: string;
}
/** w:pPr of paragraph properties (elements in schema order); '' when there is nothing to say */
export declare function pPrXml(p: PP, e?: PPExtra): string;
/** "Heading_20_1" → "Heading 1": the _xx_ escapes of style names decoded */
export declare const decodeName: (n: string) => string;
/** the name a user sees for a style */
export declare const displayName: (s: ONode) => string;
/** the Word style id and name an OpenDocument style name maps to */
export declare function wordStyleName(display: string): [string, string];
