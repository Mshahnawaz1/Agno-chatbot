import type { Part } from '../../iwork/ooxml';
import { type ONode } from './common';
/** the image format of some bytes (undefined: not one Word or a browser shows, e.g. StarView metafiles) */
export declare function sniffImage(b: Uint8Array): string | undefined;
/** Images put into word/media: one file per source image. */
export declare class OdtMedia {
    /** package path → bytes */
    readonly files: Map<string, Uint8Array<ArrayBufferLike>>;
    private names;
    /** name (in word/media) of an image, undefined for formats nobody shows */
    add(bytes: Uint8Array): {
        name: string;
        ext: string;
    } | undefined;
    /** `<Default>` content types of the media files */
    types(): string;
}
/** what the drawing converter needs from the document converter */
export interface DrawHost {
    /** the part relationships are added to (document, header, footnotes…) */
    readonly part: Part;
    readonly media: OdtMedia;
    /** bytes of a draw:image (loaded before the conversion) */
    imageBytes(el: ONode): Uint8Array | undefined;
    /** the graphic-properties of a graphic style, with what it inherits */
    graphicProps(name: string | undefined): Record<string, string>;
    /** WordprocessingML blocks of a text box's content, `width` points wide */
    boxBlocks(nodes: (ONode | string)[], width: number): string;
    /** width of the text column, points */
    readonly columnWidth: number;
    /** the target of a link (relationship id or bookmark) */
    link(href: string): {
        rid?: string;
        anchor?: string;
    };
}
/** Converts drawing objects to w:drawing runs. */
export declare class OdtDraw {
    private host;
    private id;
    /** text boxes being converted (Word has no text boxes in text boxes) */
    private boxDepth;
    constructor(host: DrawHost);
    get inBox(): boolean;
    /** the run(s) of a drawing object in a paragraph; `rPr` is the run's properties, `href` a link around it */
    object(el: ONode, rPr: string, href?: string): string;
    private size;
    private frame;
    /** a:ln of a frame's border (undefined: none said) */
    private line;
    private fill;
    private textBox;
    /** a text box inside a text box: its text as line-broken runs */
    private flatText;
    private shape;
    private wsp;
    /** the w:drawing run: inline for objects anchored as characters, floating otherwise */
    private drawing;
}
