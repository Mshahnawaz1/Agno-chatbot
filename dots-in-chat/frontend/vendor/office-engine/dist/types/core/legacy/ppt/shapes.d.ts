/**
 * OfficeArt shapes of a PowerPoint drawing → PresentationML shapes: groups (their child coordinate space kept),
 * preset and freeform geometry, fills (solid, gradient, picture), lines, pictures, placeholders, text bodies,
 * click actions. Positions are master units (576 per inch) or a group's child units, scaled to EMU alike.
 */
import type { Part } from '../../iwork/ooxml';
import type { PptDocument, SlideRef } from './document';
import { Props, type BlipStore } from './escher';
import { type TextEnv } from './paragraphs';
import { Rec } from './records';
import { type TextBlock } from './text';
export interface ShapeInfo {
    sp: Rec;
    spid: number;
    /** shape type (MSOSPT) */
    spt: number;
    /** FSP flags: 1 group, 2 child, 4 patriarch, 8 deleted, 0x10 OLE, 0x40 flipH, 0x80 flipV, 0x400 background */
    flags: number;
    props: Props;
    /** left, top, right, bottom (child anchor in groups, else the client anchor) */
    anchor?: [number, number, number, number];
    clientData?: Rec;
    textbox?: Rec;
    /** OEPlaceholderAtom: placement id and placeholder type */
    ph?: {
        pos: number;
        type: number;
    };
}
/** reads a shape container (the master shapes table resolves hspMaster: properties it does not set) */
export declare function shapeInfo(sp: Rec, masters?: Map<number, Props>, child?: boolean): ShapeInfo;
/** every shape container of a drawing (groups included), depth-first */
export declare function allShapes(dg: Rec | undefined, out?: Rec[], depth?: number): Rec[];
/** the OfficeArtDgContainer of a slide, master or notes container */
export declare const drawingOf: (rec: Rec | undefined) => Rec | undefined;
/** the p:ph element of a placeholder (undefined: not one) */
export declare function phXml(ph: ShapeInfo['ph']): string | undefined;
export interface DrawCtx {
    doc: PptDocument;
    blips: BlipStore;
    /** media file name of a picture (undefined: none a viewer can hold) */
    media: (pib: number) => Promise<string | undefined>;
    /** media file name of a pattern bitmap in two colors */
    pattern: (pib: number, fore: string, back: string) => Promise<string | undefined>;
    part: Part;
    env: TextEnv;
    /** the slide's text list (OutlineTextRefAtom indexes into it) */
    slide?: SlideRef;
    masters: Map<number, Props>;
    /** cNvPr ids */
    ids: {
        n: number;
    };
    /** shapes left out (placeholders of a master shown elsewhere…) */
    skip?: (s: ShapeInfo) => boolean;
    /** a replacement text for a shape (footer values) */
    textFor?: (s: ShapeInfo, block: TextBlock | undefined) => TextBlock | undefined;
}
/** Writes the shapes of drawings into one part (a slide, layout, master or notes page). */
export declare class DrawingWriter {
    private c;
    constructor(c: DrawCtx);
    /** the color context of a shape (its own fill and line colors for colors defined relative to them) */
    private colors;
    /** DrawingML fill of a shape (undefined: not filled) */
    fill(p: Props, picture?: boolean): Promise<string | undefined>;
    /** shaded fills: a linear gradient along the fill angle, or from the center (the focus says where the fill color sits) */
    private gradient;
    /** DrawingML line (undefined: no line); `explicitOnly`: only a line turned on explicitly (pictures) */
    line(p: Props, explicitOnly?: boolean): string | undefined;
    /** an outer shadow (effectLst) when the shape has one */
    private shadow;
    /** the shapes of a drawing (its group tree) */
    drawing(dg: Rec | undefined): Promise<string>;
    /** the background shape's fill of a drawing */
    background(dg: Rec | undefined): Promise<string | undefined>;
    private children;
    private nv;
    /** a shape's click action (hlinkClick) */
    private click;
    private group;
    private hidden;
    /** the text of a shape: its own text records, or its slide's placeholder text */
    textOf(s: ShapeInfo): TextBlock | undefined;
    shape(s: ShapeInfo): Promise<string>;
    /** a text body's bodyPr from the shape's text properties */
    private bodyPr;
    /** WordArt: its text in its font, colored like the shape's fill, sized to the frame */
    private wordArt;
    /** a picture (also an OLE object's preview); undefined when its image is missing or not one Office or a browser shows */
    private picture;
}
