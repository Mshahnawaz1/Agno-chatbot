import { type ONode, type OdfPackage, type OdfStyles } from './common';
/** points → EMU, within the range of DrawingML coordinates */
export declare const emu: (pt: number) => number;
/** the property groups of a style with what it inherits */
export interface Props {
    /** graphic properties (also drawing-page and table-cell graphic properties) */
    g: Record<string, string>;
    p: Record<string, string>;
    t: Record<string, string>;
    /** table column and row properties */
    c: Record<string, string>;
    /** text:list-style inside the graphic properties (the bullets of presentation outline styles) */
    list?: ONode;
    /** style:list-style-name of the style */
    listName?: string;
}
export declare const noProps: () => Props;
/** merges the property groups of a style element onto `out` */
export declare function mergeStyle(out: Props, s: ONode): Props;
/** `over` merged onto a copy of `base` */
export declare function overlay(base: Props, over: Props): Props;
/** the named fill, line and marker resources of office:styles, and the styles with their inheritance */
export declare class OdpStyles {
    readonly st: OdfStyles;
    readonly gradients: Map<string, ONode>;
    readonly hatches: Map<string, ONode>;
    readonly fillImages: Map<string, ONode>;
    readonly markers: Map<string, ONode>;
    readonly dashes: Map<string, ONode>;
    readonly opacities: Map<string, ONode>;
    /** table templates by name */
    readonly templates: Map<string, ONode>;
    private cache;
    private defaultCache;
    readonly stylesRoot?: ONode;
    constructor(pkg: OdfPackage);
    /** a style element; on master pages the automatic styles of styles.xml come first */
    node(family: string, name: string | undefined, master: boolean): ONode | undefined;
    /** the merged properties of a style and its parents (not the family's default style) */
    props(family: string, name: string | undefined, master?: boolean): Props;
    /** the default style of a family (presentation styles use the graphic one) */
    defaults(family: string): Props;
    /** a style with its parents over the family's default style */
    full(family: string, name: string | undefined, master?: boolean): Props;
    /** a list style by name (automatic list styles of styles.xml first on master pages) */
    list(name: string | undefined, master: boolean): ONode | undefined;
    private _masterLists?;
    private get masterLists();
}
/** "50%" or "0.5" → 0…1 */
export declare function fraction(v: string | undefined): number | undefined;
export declare const clr: (hex: string, alpha?: number) => string;
export declare const solid: (hex: string, alpha?: number) => string;
/** a dark color (automatic text white on it), as LibreOffice decides: luminance up to 156 of 255 */
export declare function isDark(hex: string): boolean;
/** an angle in degrees: "30deg", "0.5rad", "45grad"; unitless values are tenths of a degree when `tenths` */
export declare function angleDeg(v: string | undefined, tenths?: boolean): number;
/** what fills and lines need from the converter */
export interface FillEnv {
    styles: OdpStyles;
    /** relationship id of the image an element points to (draw:fill-image, draw:image), in the current part */
    image(el: ONode): Promise<{
        rid: string;
        w?: number;
        h?: number;
    } | undefined>;
}
/** draw:gradient → a:gradFill; its opacity uniform, or along a transparency gradient (draw:opacity: start, end) */
export declare function gradientXml(gr: ONode, alpha?: number, og?: ONode): string;
/**
 * Graphic properties → DrawingML fill (undefined: none). `def` is the fill when draw:fill is not set: solid for
 * shapes, none for frames (text boxes, pictures).
 */
export declare function fillXml(g: Record<string, string>, env: FillEnv, def: 'solid' | 'none', size?: [number, number]): Promise<string | undefined>;
/**
 * Graphic properties → a:ln. `def` is the stroke when draw:stroke is not set: solid for shapes and lines, none
 * for frames.
 */
export declare function lineXml(g: Record<string, string>, styles: OdpStyles, def: 'solid' | 'none'): string;
/** draw:shadow → a:effectLst (outer shadow), '' without one */
export declare function shadowXml(g: Record<string, string>): string;
export declare function fontName(v: string | undefined): string | undefined;
export declare const attr: (name: string, v: string | number | undefined) => string;
