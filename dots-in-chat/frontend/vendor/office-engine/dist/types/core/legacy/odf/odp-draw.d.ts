import { type ONode } from './common';
import { type Box } from './odp-geom';
import { type FillEnv } from './odp-style';
import { type TextEnv } from './odp-text';
/** an image file in the package, with its relationship in the current part */
export interface Img {
    rid: string;
    ext: string;
    /** natural size (pt) */
    w?: number;
    h?: number;
}
/** what drawings need from the converter */
export interface DrawEnv extends TextEnv, FillEnv {
    masterName: string;
    /** layers not shown */
    hidden: Set<string>;
    /** shape ids in the current part */
    ids: {
        n: number;
    };
    image(el: ONode): Promise<Img | undefined>;
    /** a file of the package by path */
    file(path: string): Promise<Uint8Array | undefined>;
    /** geometry of a placeholder (by presentation class) for frames without their own */
    placeholderBox(cls: string): Box | undefined;
    /** p:ph of a presentation class in this part (undefined: drawn as a plain shape) */
    ph(cls: string): string | undefined;
}
/** a converted drawing: shape tree XML and its frame (for groups) */
export interface Drawn {
    xml: string;
    box?: Box;
}
/** the style family and name of a drawing: presentation style for placeholders, graphic style for the others */
export declare function styleOf(el: ONode, masterName: string): ['presentation' | 'graphic', string | undefined];
export declare function xfrm(b: Box, tag?: string): string;
export declare class Drawer {
    private env;
    constructor(env: DrawEnv);
    private nv;
    /** the drawings of a page (or group), back to front */
    drawables(parent: ONode, nest?: number): Promise<Drawn[]>;
    drawable(el: ONode, nest?: number): Promise<Drawn | undefined>;
    /** the text frame of a drawing: its properties per outline level (outline placeholders use the master's level styles) */
    private textFrame;
    /** the a:p elements of a text frame (speaker notes) */
    paragraphs(el: ONode): string;
    /** a txBody: body properties, paragraphs ('' when there is no text and `keep` is not set) */
    private txBody;
    /** the text environment with the automatic font color of a shape's own fill */
    private envFor;
    private frame;
    private isChart;
    /** a gray box with a label, where a chart or an embedded object (not converted) was */
    private objectBox;
    private textBox;
    /** a picture: the first image a browser shows (else one Office shows), cropped by fo:clip */
    private picture;
    private shape;
    /**
     * Fontwork: text drawn along the shape's path in its fill. Approximated by the text alone, centered, colored
     * with the fill and sized to fill the frame.
     */
    private fontwork;
    private line;
    private group;
    private table;
    private cellXml;
}
