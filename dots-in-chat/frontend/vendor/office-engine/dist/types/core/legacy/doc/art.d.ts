/**
 * Pictures of a Word binary document: inline pictures (a PICF header and OfficeArt records in the Data stream) and
 * floating shapes (FSPA anchors in the text, OfficeArt drawings and the BLIP store in the table stream).
 */
import { Bytes } from './bin';
export interface Blip {
    ext: 'png' | 'jpeg' | 'gif' | 'bmp' | 'emf' | 'wmf' | 'pict' | 'tiff';
    data: Uint8Array;
    /** the data is zlib-compressed (metafiles) */
    deflated?: boolean;
    /** a metafile's bounds (logical units) and size (EMU): a Windows metafile gets its placeable header from them */
    bounds?: {
        l: number;
        t: number;
        r: number;
        b: number;
        cx: number;
        cy: number;
    };
}
/** an image's content type */
export declare const IMAGE_TYPES: Record<Blip['ext'], string>;
/** A BLIP record (OfficeArtBlip*) at `off` → the image bytes. */
export declare function readBlip(b: Bytes, off: number, end?: number): Blip | undefined;
/** OfficeArt records in [start, end): calls `fn` with each record's header fields and body offset */
export declare function records(b: Bytes, start: number, end: number, fn: (type: number, inst: number, body: number, len: number) => void | false): void;
/** shape properties (FOPT): property id → value; complex values become their data offsets */
export declare function fopt(b: Bytes, body: number, len: number, count: number): Map<number, number>;
export interface Picf {
    /** shown size, twips */
    w: number;
    h: number;
    /** crop (fractions of the full image, 0-1) */
    crop?: {
        l: number;
        t: number;
        r: number;
        b: number;
    };
    blip?: Blip;
    /** the picture is in the document's BLIP store (1-based index) */
    pib?: number;
}
/** A picture in the Data stream at `fc` (the target of sprmCPicLocation). */
export declare function readPicf(data: Bytes, fc: number): Picf | undefined;
/**
 * A Windows metafile without its placeable header → one Word and image tools read. The bounding box is in the
 * metafile's logical units (twips when not given), `inch` the logical units per inch.
 */
export declare function placeable(wmf: Uint8Array, w: number, h: number, box?: {
    l: number;
    t: number;
    r: number;
    b: number;
}, inch?: number): Uint8Array;
export interface Shape {
    spid: number;
    /** shape type (msospt: 75 picture frame, 202 text box, 1 rectangle…) */
    type: number;
    /** BLIP store index (1-based) of a picture */
    pib?: number;
    /** text box id (lTxid) */
    txid?: number;
    fill?: string;
    line?: string;
    lineW?: number;
    /** WordArt: its text and font */
    text?: string;
    font?: string;
    /** a group's shapes */
    kids?: Shape[];
    /** child anchor (in the group's coordinates) */
    child?: {
        l: number;
        t: number;
        r: number;
        b: number;
    };
    /** group coordinate space */
    group?: {
        l: number;
        t: number;
        r: number;
        b: number;
    };
    hidden?: boolean;
}
/** The OfficeArt content of the table stream: the BLIP store and the shapes of the main text and of the headers. */
export declare class Drawings {
    private tbl;
    private wd;
    /** the BLIP store: offsets of the FBSE records' bodies */
    private bstore;
    private shapes;
    private cache;
    constructor(tbl: Bytes, wd: Bytes, fc: number, lcb: number);
    /** reads a group container (OfficeArtSpgrContainer): its shapes and sub-groups */
    private group;
    private shape;
    shape0(spid: number): Shape | undefined;
    /** the image of a BLIP store entry (1-based), from the FBSE or the WordDocument stream it points into */
    blip(pib: number): Blip | undefined;
}
/** a floating shape's anchor (FSPA) */
export interface Fspa {
    spid: number;
    l: number;
    t: number;
    r: number;
    b: number;
    /** horizontal position relative to: 0 margin, 1 page, 2 column */
    bx: number;
    /** vertical position relative to: 0 margin, 1 page, 2 paragraph */
    by: number;
    /** wrapping: 0/2 square, 1 top and bottom, 3 none, 4 tight, 5 through */
    wr: number;
    wrk: number;
    below: boolean;
}
export declare function readFspa(b: Bytes, o: number): Fspa;
/** zlib data → bytes (undefined when it does not inflate) */
export declare function inflate(data: Uint8Array): Promise<Uint8Array | undefined>;
/** the bytes of an image file: metafiles inflated, Windows metafiles with a placeable header */
export declare function imageBytes(blip: Blip): Promise<Uint8Array>;
