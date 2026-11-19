import { type XEl } from '../xml';
export interface LineEx {
    rounding?: number;
    start?: number;
    end?: number;
    startSize?: number;
    endSize?: number;
    pattern?: number;
}
interface VarStyle {
    fill: number;
    line: number;
    font: number;
}
export interface VisioTheme {
    /** the number pages name the theme by (ThemeIndex) */
    id?: number;
    /** dk1, lt1, dk2, lt2, accent1-6, and bkgnd */
    colors: Record<string, string>;
    /** the color variations: 7 colors each */
    variations: string[][];
    font?: string;
    fills: XEl[];
    lines: XEl[];
    connectorLines: XEl[];
    lineEx: LineEx[];
    connectorLineEx: LineEx[];
    fonts: {
        color?: XEl;
        style: number;
    }[];
    connectorFonts: {
        color?: XEl;
        style: number;
    }[];
    fillPatterns: number[];
    /** the style variations: 4 styles each */
    varStyles: VarStyle[][];
}
export declare function parseVisioTheme(xml: string): VisioTheme;
/** a color with how see-through it is (0 opaque … 1 clear) */
export interface Paint {
    hex: string;
    trans: number;
}
/** A DrawingML color; `phClr` is the color the style is applied with. Tints and shades mix in linear light, as Office does. */
export declare function drawingPaint(el: XEl | undefined, theme: VisioTheme, phClr: string | undefined): Paint | undefined;
export interface ThemedFill {
    /** the solid color, or a gradient's first */
    color: Paint;
    /** a gradient's stops (pos 0-1) and its angle in degrees, clockwise from left-to-right */
    stops?: {
        pos: number;
        paint: Paint;
    }[];
    angle?: number;
    radial?: boolean;
    pattern: number;
}
export interface ThemedLine {
    color?: Paint;
    /** inches */
    weight?: number;
    pattern: number;
    ex: LineEx;
}
/** What a page's theme gives a shape: the page picks the theme and its variation, the shape the colors and styles. */
export declare class ThemeLook {
    private theme;
    private colors;
    private variationColor;
    private variationStyle;
    constructor(theme: VisioTheme, colors: VisioTheme, variationColor: number, variationStyle: number);
    get font(): string | undefined;
    get background(): string;
    /** the color a QuickStyle…Color cell names: 0 dark, 1 light, 2-7 accents, 8 background, 100-106 the variation's */
    color(index: number): string | undefined;
    /** the style number (1-based) a QuickStyle…Matrix cell names: itself, or the one its style variation gives */
    private index;
    private paint;
    fill(matrix: number, color: number): ThemedFill | undefined;
    line(matrix: number, color: number, connector: boolean): ThemedLine | undefined;
    /** the text color and the Style bits (bold, italic…) */
    text(matrix: number, color: number, connector: boolean): {
        color?: Paint;
        style: number;
    };
}
/** how light a color is, 0-1 */
export declare function luminance(hex: string): number;
/** the color, as light as `lum` (0-1): its hue and saturation kept */
export declare function withLuminance(hex: string, lum: number): string;
export {};
