import { HexSink } from './lexer';
export interface Pict {
    /** blip kind: png, jpeg, emf, wmf, dib, bmp, mac, other */
    kind?: string;
    data: HexSink;
    picw?: number;
    pich?: number;
    goalw?: number;
    goalh?: number;
    scalex?: number;
    scaley?: number;
    cropl?: number;
    cropr?: number;
    cropt?: number;
    cropb?: number;
}
export interface Image {
    ext: string;
    bytes: Uint8Array;
    /** shown size (twips) */
    w: number;
    h: number;
    /** a:srcRect (1/1000 %) */
    crop?: {
        l: number;
        t: number;
        r: number;
        b: number;
    };
}
/** a packed DIB (BITMAPINFOHEADER + colors + bits) as a .bmp file */
export declare function dibToBmp(d: Uint8Array): Uint8Array | undefined;
/** the image of a picture, or undefined when it is not one a browser shows */
export declare function pictImage(p: Pict): Image | undefined;
/** Media of the package: images by content (the same picture used twice is stored once). */
export declare class Media {
    readonly files: Map<string, Uint8Array<ArrayBufferLike>>;
    private byKey;
    private docPr;
    /** file name (in word/media) of an image */
    name(img: Image): string;
    /** a new drawing object id */
    id(): number;
}
/** where a floating object sits (`\shp` properties) */
export interface Anchor {
    x: number;
    y: number;
    relH: string;
    relV: string;
    wrap: number;
    wrapSide?: number;
    behind: boolean;
    z: number;
}
/** a wp:inline / wp:anchor around a graphic */
export declare function drawingXml(id: number, w: number, h: number, graphic: string, name: string, anchor?: Anchor, descr?: string): string;
/** the a:graphic of a picture */
export declare function pictureGraphic(id: number, rid: string, img: Image, w?: number, h?: number): string;
/** the a:graphic of a text box */
export declare function textBoxGraphic(w: number, h: number, body: string, fill: string | undefined, line: string | undefined, lineW: number, ins: [number, number, number, number]): string;
