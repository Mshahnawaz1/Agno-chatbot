/**
 * Compound File Binary (MS-CFB, "OLE2 structured storage"): the container of the Office 97-2003 binary formats
 * (.doc, .xls, .ppt). A small file system of storages (folders) and streams (files) in fixed-size sectors.
 */
/** the 8-byte CFB signature */
export declare const isCfb: (b: Uint8Array) => boolean;
export interface CfbEntry {
    /** "/"-separated path from the root storage (the root itself is not part of it): "WordDocument", "ObjectPool/_1234/\u0001Ole" */
    path: string;
    name: string;
    type: 'storage' | 'stream';
    size: number;
    /** CLSID of a storage, as 32 hex digits (zeros when unset) */
    clsid: string;
}
/** A compound file read whole into memory: its streams by path. */
export declare class Cfb {
    readonly bytes: Uint8Array;
    private entries;
    private sectorSize;
    private miniSize;
    private cutoff;
    private fat;
    private miniFat;
    private miniStream;
    private constructor();
    /** Reads a compound file (the whole file in memory). Throws when it is not one or is damaged. */
    static open(bytes: Uint8Array): Cfb;
    private offset;
    /** the bytes of a sector chain (a stream in the big sectors), cut to `size` when given */
    private chain;
    /** the bytes of a mini stream chain (streams under the cutoff size) */
    private miniChain;
    /** every storage and stream, in directory order (parents before children) */
    list(): CfbEntry[];
    /** a stream or storage exists at the path (names compare case-insensitively, as in CFB) */
    has(path: string): boolean;
    /** the entries directly inside a storage ("" for the root) */
    children(path: string): CfbEntry[];
    /** the bytes of a stream, or undefined when there is none at the path */
    stream(path: string): Uint8Array | undefined;
}
