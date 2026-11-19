/**
 * iWork text styles (TSWP paragraph, character and list styles; TSS style inheritance), read into plain
 * properties shared by the Pages and Keynote converters.
 */
import type { IworkPackage } from './iwa';
import type { Msg } from './proto';
export interface CharProps {
    b?: boolean;
    i?: boolean;
    sz?: number;
    font?: string;
    /** rrggbb */
    color?: string;
    va?: 'superscript' | 'subscript' | 'baseline';
    /** 'none' | 'single' | 'double' | 'wave' */
    u?: string;
    strike?: 'single' | 'double' | 'none';
    caps?: 'caps' | 'smallCaps' | 'none';
    /** background (rrggbb) */
    shd?: string;
    /** baseline shift (pt) */
    shift?: number;
    /** tracking: fraction of the font size */
    track?: number;
}
export interface ParaProps {
    align?: 'left' | 'right' | 'center' | 'both';
    /** first line indent, measured like the left indent (from the margin) */
    first?: number;
    left?: number;
    right?: number;
    before?: number;
    after?: number;
    line?: {
        rule: 'auto' | 'atLeast' | 'exact';
        v: number;
    };
    pbb?: boolean;
    keepNext?: boolean;
    keepLines?: boolean;
    fill?: string;
    outline?: number;
    list?: number;
}
export interface ListLevel {
    kind: 'none' | 'bullet' | 'number';
    /** bullet character */
    text: string;
    /** number style: 0 decimal, 1 upper roman, 2 lower roman, 3 upper letter, 4 lower letter */
    fmt: number;
    /** punctuation: 0 "1.", 1 "(1)", 2 "1)" */
    punct: number;
    /** "1.2.3" numbering */
    tiered: boolean;
    /** label indent (pt) */
    indent: number;
    /** label to text distance, in font sizes */
    textIndent: number;
}
/** TSP.Color → rrggbb (undefined when fully transparent) */
export declare function hexColor(m: Msg | undefined): string | undefined;
/** TSD.FillArchive → rrggbb (a gradient gives its first stop) */
export declare function fillColor(m: Msg | undefined): string | undefined;
/** PostScript font name ("HelveticaNeue-BoldItalic") → family + the bold / italic its face implies */
export declare function psFont(name: string): {
    family: string;
    b?: boolean;
    i?: boolean;
};
/** TSWP.CharacterStylePropertiesArchive */
export declare function readChar(m: Msg | undefined): CharProps;
/** TSWP.ParagraphStylePropertiesArchive */
export declare function readPara(m: Msg | undefined): ParaProps;
interface StyleRec {
    name?: string;
    parent?: number;
    variation: boolean;
    /** the TSS.StyleArchive-carrying message */
    msg: Msg;
}
export interface Resolved {
    /** what the style's variations change over its named style */
    pDirect: ParaProps;
    cDirect: CharProps;
    /** everything the style sets, its ancestors included */
    pFull: ParaProps;
    cFull: CharProps;
    /** font size (pt) */
    sz: number;
}
/** Style lookup with inheritance; results are cached. */
export declare class IworkStyles {
    private pkg;
    private cache;
    private resolvedCache;
    private charCache;
    private lists;
    constructor(pkg: IworkPackage);
    /** style object (paragraph, character, list, cell or shape); `nest`: depth of the TSS.StyleArchive in it */
    style(id: number | undefined, nest?: number): StyleRec | undefined;
    /** the style and its ancestors, nearest first (up to `stop`, excluded) */
    chain(id: number | undefined, nest?: number, stop?: number): Msg[];
    /** nearest non-variation style (the one a paragraph names) */
    named(id: number | undefined): number | undefined;
    charOf(chain: Msg[]): CharProps;
    paraOf(chain: Msg[]): ParaProps;
    /** a paragraph style: its direct properties (variations over the named style), all its properties, its font size */
    resolved(paraId: number | undefined): Resolved;
    /** everything a character style sets */
    charFull(charId: number | undefined): CharProps;
    /** the 9 levels of a list style, undefined when none has a label */
    list(id: number | undefined): ListLevel[] | undefined;
}
/** distance from a list label to its text (pt), for text of size `sz` */
export declare const hangOf: (l: ListLevel, sz: number) => number;
export {};
