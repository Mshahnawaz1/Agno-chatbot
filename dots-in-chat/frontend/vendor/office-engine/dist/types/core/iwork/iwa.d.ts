import { ZipArchive } from '../zip';
import { Msg } from './proto';
export interface IwaObject {
    type: number;
    data: Uint8Array;
}
/** Decompressed contents of an .iwa file. */
export declare function iwaBytes(src: Uint8Array): Uint8Array;
/** Objects of an .iwa file, by identifier. */
export declare function readIwa(src: Uint8Array, into?: Map<number, IwaObject>): Map<number, IwaObject>;
/** where the package's files are in the ZIP: '' or the zipped package folder ("Report.pages/"); undefined: not iWork */
export declare function iworkRoot(zip: ZipArchive): string | undefined;
/** Is this ZIP an iWork '13+ package (and not OOXML)? A password-protected one may hold only its hint. */
export declare function isIworkZip(zip: ZipArchive): boolean;
export declare class IworkPackage {
    readonly zip: ZipArchive;
    readonly objects: Map<number, IwaObject>;
    /** folder of the package in the ZIP ('' or "Report.pages/") */
    readonly root: string;
    private cache;
    private dataFiles;
    private constructor();
    static open(outer: ZipArchive): Promise<IworkPackage>;
    type(id: number | undefined): number | undefined;
    get(id: number | undefined): Msg | undefined;
    /** identifiers of objects of a message type */
    ofType(type: number): number[];
    private mapData;
    /** the document's locale ("en_GB"): TSK.DocumentArchive inside the Pages / Numbers / Keynote document */
    locale(): string | undefined;
    /** ZIP path of a data file (image, movie, font…) */
    dataPath(id: number | undefined): string | undefined;
}
