import { type OdfPackage, type ONode } from './common';
import { type PP, type RP, type Tab } from './odt-props';
/** how a paragraph style resolves: the Word style and the direct formatting of its automatic styles */
export interface ParaInfo {
    styleId: string;
    pp: PP;
    /** the run properties text in the paragraph starts from */
    rc: RunCtx;
    /** effective font size, points */
    sz: number;
    /** style:master-page-name ('' = none) */
    master?: string;
    /** style:list-style-name ('' = none) */
    listStyle?: string;
    /** style:default-outline-level of the style chain (1-based) */
    outline?: number;
    /** left indent with everything inherited, points (tab stops and old-style lists are relative to it) */
    left: number;
    /** first line indent with everything inherited */
    first: number;
    /** a named style sets an indent below the one giving the list style (LibreOffice then keeps it over the list's) */
    styleIndent: boolean;
    /** tab stops of the named style chain (Word coordinates), cleared by the paragraph's own */
    tabs?: Tab[];
}
/** run properties in effect while walking a paragraph's content */
export interface RunCtx {
    rp: RP;
    rStyle?: string;
    rStyleNode?: ONode;
    sz: number;
    /** cached w:rPr */
    x?: string;
}
export declare class OdtStyles {
    readonly st: OdfPackage['styles'];
    /** styles of office:styles: the others are automatic (direct formatting) */
    readonly common: Set<ONode>;
    /** Word style id of each named style */
    readonly styleIds: Map<ONode, string>;
    /** ids of the styles some content uses */
    readonly usedIds: Set<string>;
    readonly outlineStyle?: ONode;
    readonly defaultSize: number;
    /** tab stop positions are relative to the paragraph indent (LibreOffice's default) */
    readonly tabsRelative: boolean;
    /** converting master page content (headers, footers): styles.xml's automatic styles come first */
    inMaster: boolean;
    private takenIds;
    private takenNames;
    private names;
    private synth;
    private paraCache;
    private spanCache;
    private charCache;
    constructor(pkg: OdfPackage);
    /** the Word style id of a named text style (marked used) */
    textStyleId(name: string | undefined): string | undefined;
    look(family: string, name: string | undefined): ONode | undefined;
    /** a style and the styles it inherits from (not the default style) */
    chain(family: string, name: string | undefined): ONode[];
    /** a property group of a style with what it inherits (the family's default style first) */
    props(family: string, name: string | undefined, group: string): Record<string, string>;
    readonly font: (name: string | undefined) => string | undefined;
    private assignStyleIds;
    /** effective font size along a style chain (style first), from the default size */
    private chainSize;
    /** a missing heading style ("Heading_20_2" referenced but not defined): Word's look of one */
    private synthHeading;
    /** how a paragraph style resolves (cached per style and context) */
    para(name: string | undefined, heading?: number): ParaInfo;
    /** whether a style chain (style first) sets an indent before (or without) a style giving a list style */
    private styleIndent;
    /** tab stops (Word coordinates) a style chain (style first) ends up with */
    private styleTabs;
    /** run properties of a character style with what it inherits (list labels; outer spans) */
    charProps(name: string | undefined, base?: number): RP;
    /** the run context inside a span (or link) with a text style */
    span(rc: RunCtx, name: string | undefined): RunCtx;
    rPr(rc: RunCtx): string;
    /** a list style by name */
    lists(name: string | undefined): ONode | undefined;
    /** word/styles.xml: document defaults, the named styles, heading styles made up for missing ones */
    stylesXml(ns: string): string;
}
