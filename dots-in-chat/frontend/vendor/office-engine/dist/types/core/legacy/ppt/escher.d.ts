/**
 * OfficeArt drawings ([MS-ODRAW]): shape property tables (FOPT) with their master shape's as fallback,
 * colors (OfficeArtCOLORREF), the picture store (BStore → FBSE → BLIP, embedded or in the Pictures stream),
 * preset shape types and freeform paths (vertices and segments).
 */
import { Rec } from './records';
/** property ids */
export declare const P: {
    readonly rotation: 4;
    readonly lTxid: 128;
    readonly dxTextLeft: 129;
    readonly dyTextTop: 130;
    readonly dxTextRight: 131;
    readonly dyTextBottom: 132;
    readonly wrapText: 133;
    readonly anchorText: 135;
    readonly txflTextFlow: 136;
    readonly textBooleans: 191;
    readonly gtextUNICODE: 192;
    readonly gtextFont: 197;
    readonly cropFromTop: 256;
    readonly cropFromBottom: 257;
    readonly cropFromLeft: 258;
    readonly cropFromRight: 259;
    readonly pib: 260;
    readonly geoLeft: 320;
    readonly geoTop: 321;
    readonly geoRight: 322;
    readonly geoBottom: 323;
    readonly pVertices: 325;
    readonly pSegmentInfo: 326;
    readonly adjustValue: 327;
    readonly fillType: 384;
    readonly fillColor: 385;
    readonly fillOpacity: 386;
    readonly fillBackColor: 387;
    readonly fillBackOpacity: 388;
    readonly fillBlip: 390;
    readonly fillAngle: 395;
    readonly fillFocus: 396;
    readonly fillShadeColors: 407;
    readonly fillBooleans: 447;
    readonly lineColor: 448;
    readonly lineOpacity: 449;
    readonly lineBackColor: 450;
    readonly lineWidth: 459;
    readonly lineStyle: 461;
    readonly lineDashing: 462;
    readonly lineStartArrowhead: 464;
    readonly lineEndArrowhead: 465;
    readonly lineStartArrowWidth: 466;
    readonly lineStartArrowLength: 467;
    readonly lineEndArrowWidth: 468;
    readonly lineEndArrowLength: 469;
    readonly lineBooleans: 511;
    readonly hspMaster: 769;
    readonly shapeName: 896;
    readonly description: 897;
    readonly groupBooleans: 959;
};
interface Prop {
    value: number;
    complex?: Uint8Array;
}
/** reads an OfficeArtFOPT (or secondary / tertiary FOPT) into a property map */
export declare function readFopt(r: Rec, into?: Map<number, Prop>): Map<number, Prop>;
/** A shape's properties, falling back to its master shape's (placeholders and shapes that follow a master shape). */
export declare class Props {
    readonly own: Map<number, Prop>;
    readonly master?: Props | undefined;
    private depth;
    constructor(own: Map<number, Prop>, master?: Props | undefined, depth?: number);
    has(pid: number): boolean;
    get(pid: number): number | undefined;
    num(pid: number, def: number): number;
    /** signed 32-bit */
    int(pid: number, def: number): number;
    /** a 16.16 fixed-point value */
    fixed(pid: number, def: number): number;
    complex(pid: number): Uint8Array | undefined;
    /** a UTF-16 string property */
    str(pid: number): string | undefined;
    /**
     * A bit of a boolean property set: bit `bit` with its "use" bit at `bit + 16`. Writers that set no use bits at
     * all store plain values.
     */
    flag(pid: number, bit: number, def: boolean): boolean;
    /** these properties over a master shape's */
    over(master: Props | undefined): Props;
}
/** an IMsoArray: its elements as byte slices */
export declare function msoArray(b: Uint8Array | undefined): Uint8Array[];
export declare const rgbHex: (r: number, g: number, b: number) => string;
/** colors a scheme-relative color can refer to (the shape's own fill and line colors) */
export interface ColorCtx {
    /** the slide's color scheme: background, text, shadow, title, fill, accent, hyperlink, followed hyperlink */
    scheme: string[];
    fill?: string;
    line?: string;
    fillBack?: string;
    lineBack?: string;
    shadow?: string;
}
/** OfficeArtCOLORREF → RRGGBB */
export declare function colorRef(v: number | undefined, ctx: ColorCtx): string | undefined;
export interface Blip {
    ext: string;
    data: Uint8Array;
}
/** The picture store: FBSE entries of the drawing group, their BLIPs embedded or in the Pictures stream. */
export declare class BlipStore {
    private pictures;
    private entries;
    private cache;
    constructor(dgg: Rec | undefined, pictures: Uint8Array | undefined);
    /** the picture of a 1-based BLIP index */
    get(pib: number | undefined): Promise<Blip | undefined>;
    private load;
}
/** a two-color pattern bitmap (1 bit per pixel) recolored with the fill's colors, as a 24-bit .bmp */
export declare function patternBmp(blip: Blip | undefined, fore: string, back: string): Uint8Array | undefined;
/** the preset geometry of a shape type (WordArt and unknown types: a rectangle) */
export declare const presetOf: (spt: number) => string;
/** shape types drawn as lines (connectors) */
export declare const isLineType: (spt: number) => boolean;
/**
 * Adjust values (in the shape's 21600 coordinate space) → DrawingML guide values, for the presets whose meaning maps
 * directly; others keep their defaults.
 */
export declare function adjustments(spt: number, props: Props, w: number, h: number): string;
/**
 * An arc (shape type 19): part of an ellipse from the start to the end angle (clockwise degrees, adjust values 1
 * and 2). Its frame is the box of the arc itself, not of the whole ellipse, so the path is written in that box.
 */
export declare function arcPath(props: Props, filled: boolean): string;
/** a freeform: vertices and segments (in the geometry's coordinate space) → custGeom path commands */
export declare function freeformPath(props: Props): {
    d: string;
    w: number;
    h: number;
    closed: boolean;
} | undefined;
export {};
