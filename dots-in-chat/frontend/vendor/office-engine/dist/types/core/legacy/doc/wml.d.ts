import { type Brc, type Chp, type Pap, type Sep } from './props';
import type { Font, Lvl } from './styles';
/** a border element (`w:val="nil"` for none) */
export declare function brcXml(tag: string, b: Brc): string;
export declare const fontName: (fonts: Font[], i: number) => string;
/**
 * w:rPr content of a run whose properties are `c`, written as the differences from `base` (what the styles give).
 * `extra` goes first (w:rStyle).
 */
export declare function rPrInner(c: Chp, base: Chp, fonts: Font[], extra?: string): string;
export declare const rPrXml: (c: Chp, base: Chp, fonts: Font[], extra?: string) => string;
export interface PExtra {
    style?: string;
    numPr?: string;
    markRPr?: string;
    sectPr?: string;
    /** keep with next (table rows that hold together) */
    keepNext?: boolean;
}
/** w:pPr of a paragraph whose properties are `a`, written as the differences from `base` */
export declare function pPrXml(a: Pap, base: Pap, e?: PExtra): string;
/** w:sectPr of a section (`refs`: its header / footer references) */
export declare function sectPrXml(s: Sep, refs: string, first: boolean): string;
/** a list level's paragraph properties (its indents and tab) */
export declare function lvlPap(l: Lvl): Pap;
/** a w:lvl element */
export declare function lvlXml(ilvl: number, l: Lvl, rPr: string, pStyle?: string): string;
/** namespaces of the WordprocessingML parts */
export declare const NS: string;
/** text for w:t: lone surrogates and characters XML cannot hold are dropped */
export declare function clean(s: string): string;
