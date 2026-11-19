import type { Theme } from '../theme';
import { type XEl } from '../xml';
import type { Border, CanonStyle, ParaStyle, RunStyle, StyleInfo } from './types';
export declare const HIGHLIGHT: Record<string, string>;
/** a WordprocessingML color (six hex digits; `auto` and anything else: none) as `#rrggbb` */
export declare const hexColor: (v: string | undefined) => string | undefined;
export declare function shading(el: XEl | undefined): string | undefined;
export declare function border(el: XEl | undefined): Border | undefined | null;
export declare const borderCss: (b: Border | null | undefined) => string | undefined;
/** the font an rFonts element names (theme fonts resolved) */
export declare function fontName(rf: XEl, theme: Theme): string | undefined;
export declare function readRPr(rPr: XEl | undefined, theme: Theme): RunStyle;
export interface NumPr {
    numId: string;
    ilvl: number;
}
export interface PPrResult {
    ps: ParaStyle;
    styleId?: string;
    numPr?: NumPr;
    sectPr?: XEl;
}
export declare function readPPr(pPr: XEl | undefined): PPrResult;
export declare const merge: <T extends object>(...parts: (T | undefined)[]) => T;
export interface ResolvedParaStyle {
    ps: ParaStyle;
    rs: RunStyle;
    numPr?: NumPr;
}
export interface CondFormat {
    rs: RunStyle;
    shd?: string;
}
export interface ResolvedTableStyle {
    ps: ParaStyle;
    rs: RunStyle;
    borders: Record<string, Border | null | undefined>;
    cellMar: Partial<Record<'top' | 'left' | 'bottom' | 'right', number>>;
    shd?: string;
    cond: Record<string, CondFormat>;
}
export declare class StyleSheet {
    private theme;
    private defs;
    private paraCache;
    private charCache;
    private tblCache;
    defaultPara?: string;
    defaultTable?: string;
    docRs: RunStyle;
    docPs: ParaStyle;
    constructor(root: XEl | undefined, theme: Theme);
    /** registers a style element added to styles.xml, or the new definition of a style that changed */
    add(s: XEl): void;
    /** the element of paragraph style `id`: what the style says itself, nothing inherited */
    own(id: string): XEl | undefined;
    /** what paragraph style `id` gets from the styles it is based on and the document defaults, its own properties left out */
    inherited(id: string): ResolvedParaStyle;
    /** paragraph style `id` and every paragraph style based on it, directly or not */
    family(id: string): string[];
    /** ids of the built-in paragraph styles present in the document (matched by name, any locale id) */
    canonical(): Partial<Record<CanonStyle, string>>;
    has(id: string): boolean;
    /** Paragraph styles offered in the style picker (Normal, Title, Heading 1…). */
    quickStyles(): StyleInfo[];
    private chain;
    para(id: string | undefined): ResolvedParaStyle;
    char(id: string | undefined): RunStyle;
    table(id: string | undefined): ResolvedTableStyle;
}
export declare function readTableBorders(el: XEl | undefined): Record<string, Border | null | undefined>;
export declare function readMargins(el: XEl | undefined): Partial<Record<'top' | 'left' | 'bottom' | 'right', number>>;
