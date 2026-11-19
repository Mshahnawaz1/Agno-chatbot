/** Images of an OpenDocument package for the PPTX: their type from their bytes, natural size, unique names. */
import type { ONode, OdfPackage } from './common';
/** image type from the first bytes: png, jpeg, gif, bmp, webp, svg, emf, wmf, tiff (others: undefined) */
export declare function sniffImage(b: Uint8Array): string | undefined;
/** the natural size of an image in points (its pixels at its resolution, 96 dpi when it has none) */
export declare function naturalSize(b: Uint8Array, type: string): {
    w: number;
    h: number;
} | undefined;
export declare const IMAGE_MIME: Record<string, string>;
export interface MediaFile {
    /** file name in ppt/media */
    name: string;
    type: string;
    w?: number;
    h?: number;
}
/** the images copied into ppt/media, once each */
export declare class Media {
    private pkg;
    readonly files: Map<string, Uint8Array<ArrayBufferLike>>;
    private known;
    private bytesTotal;
    constructor(pkg: OdfPackage);
    get(el: ONode): Promise<MediaFile | undefined>;
    /** `<Default>` content types of the files */
    contentTypes(): string;
}
