import type { IworkPackage } from './iwa';
import type { Msg } from './proto';
export declare const XML_HEAD = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n";
/** a package part and its relationships */
export declare class Part {
    readonly path: string;
    rels: string[];
    private links;
    constructor(path: string);
    /** relationship id of a target (relationship types are the officeDocument ones: image, hyperlink…) */
    rel(type: string, target: string, external?: boolean): string;
    get relsPath(): string;
    relsXml(): string;
}
/** `<Default>` content types of the media extensions */
export declare function mediaTypes(names: Iterable<string>): string;
/** Images copied from the iWork package's Data/ folder into `dir` of the OOXML package. */
export declare class Media {
    private pkg;
    private dir;
    private names;
    /** OOXML path → iWork package path */
    readonly files: Map<string, string>;
    constructor(pkg: IworkPackage, dir: string);
    /** file name (in `dir`) of a data object */
    name(dataId: number): string;
    bytes(): Promise<Map<string, Uint8Array>>;
}
/** the data id of the first image of a TSD.ImageArchive that a browser shows (adjusted, current, original, thumbnail) */
export declare function imageData(pkg: IworkPackage, m: Msg, fields?: number[]): number | undefined;
