import type { ByteSource } from './source';
export interface ZipEntry {
    name: string;
    method: number;
    flags: number;
    crc: number;
    time: number;
    date: number;
    compSize: number;
    size: number;
    localOffset: number;
    dataOffset?: number;
}
/**
 * What a package may ask of the reader. The sizes in a ZIP are whatever its author wrote: a file of a few kilobytes
 * can announce (or unpack to) gigabytes, and name the same part twice. Past these limits the file is refused with
 * an error instead of the memory being asked for. They are far above what documents hold (an object, so that the
 * tests can lower them).
 */
export declare const ZIP_LIMITS: {
    /** entries of the central directory */
    entries: number;
    /** bytes of the central directory */
    directory: number;
    /** bytes of a part read whole into memory (`bytes`, `text`): XML parsed as one text, pictures */
    whole: number;
    /** bytes of a part read as a stream (`stream`): sheet data, a document's body */
    stream: number;
};
/**
 * Lazy ZIP reader: parses only the central directory, then inflates single
 * entries on demand straight from the byte source (native DecompressionStream).
 */
export declare class ZipArchive {
    readonly src: ByteSource;
    private entries;
    private constructor();
    static open(src: ByteSource): Promise<ZipArchive>;
    private readDirectory;
    list(): ZipEntry[];
    get(path: string): ZipEntry | undefined;
    has(path: string): boolean;
    private dataOffset;
    /** Compressed bytes of an entry, as stored (zero-copy Blob slice when the source allows). */
    rawData(e: ZipEntry): Promise<Blob | Uint8Array>;
    /**
     * Decompressed stream of an entry. `onRaw` reports compressed bytes consumed. The stream fails past `limit`
     * unpacked bytes (default `ZIP_LIMITS.stream`), whatever size the entry announces.
     */
    stream(path: string, onRaw?: (consumed: number, total: number) => void, limit?: number): Promise<ReadableStream<Uint8Array>>;
    /** An entry unpacked whole into memory: at most `ZIP_LIMITS.whole` bytes. */
    bytes(path: string): Promise<Uint8Array>;
    text(path: string): Promise<string>;
}
export declare function normalize(path: string): string;
