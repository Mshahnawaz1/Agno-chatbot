import { type XEl } from './xml';
import type { Theme } from './theme';
export type RGB = [number, number, number];
/**
 * `v` when it is a color and nothing more: hex digits, rgb() / hsl() of numbers, or a color name. Anything else
 * (another function, a second value, a quote) is undefined.
 */
export declare function cssColor(v: unknown): string | undefined;
/** `v` when it is a color, or a gradient the way the engine writes one (an angle or `circle`, then color stops). */
export declare function cssPaint(v: unknown): string | undefined;
/**
 * The color a file gives as hex digits ("FF0000", SpreadsheetML's "FFFF0000" with its alpha first, or "F00"), as
 * `#rrggbb`; undefined for anything that is not exactly that.
 */
export declare function fileHex(v: string | undefined): string | undefined;
/**
 * A color an edit asks for (`#rrggbb` or `#rgb`, from the color picker, a peer or a host application) as the six
 * upper-case digits an Office file stores; undefined for anything else, which is then not written: the text would
 * become part of the file's XML and of what everyone who opens it is shown.
 */
export declare function officeHex(color: string | null | undefined): string | undefined;
export declare function hexToRgb(hex: string): RGB;
export declare function rgbToHex([r, g, b]: RGB): string;
export declare function rgbToHsl([r, g, b]: RGB): [number, number, number];
export declare function hslToRgb([h, s, l]: [number, number, number]): RGB;
/** Excel/Word style tint (-1..1) applied in HSL luminance. */
export declare function applyTint(hex: string, tint: number): string;
export interface ColorCtx {
    theme?: Theme;
    /** pptx clrMap: bg1→lt1 … */
    clrMap?: Record<string, string>;
    /** Placeholder color for style matrix references. */
    phClr?: string;
}
export declare const COLOR_TAGS: Set<string>;
/** Resolves a DrawingML color element (srgbClr, schemeClr, …) to a CSS color. */
export declare function drawingColor(el: XEl, ctx: ColorCtx): string | undefined;
/** First color child of a fill-ish element (solidFill, fgClr, …). */
export declare function colorOf(parent: XEl | undefined, ctx: ColorCtx): string | undefined;
export declare const INDEXED: string[];
/** SpreadsheetML <color rgb|theme|indexed tint>. */
export declare function sheetColor(el: XEl | undefined, theme: Theme | undefined, indexed?: string[]): string | undefined;
export declare function customIndexed(stylesRoot: XEl | undefined): string[];
