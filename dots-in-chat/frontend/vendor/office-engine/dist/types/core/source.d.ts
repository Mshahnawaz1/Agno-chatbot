/**
 * Random-access byte sources. The ZIP reader only touches the bytes it needs
 * (central directory + requested entries), so a 500 MB file is never read in full.
 */
export interface ByteSource {
    readonly size: number;
    readonly name?: string;
    /** MIME type, when known (a Blob's type, the server's Content-Type) */
    readonly type?: string;
    read(offset: number, length: number): Promise<Uint8Array>;
    stream(offset: number, length: number): ReadableStream<Uint8Array>;
    /** Zero-copy sub-Blob when available (used when re-zipping unchanged entries). */
    slice?(offset: number, length: number): Blob;
}
export type ProgressFn = (loaded: number, total: number) => void;
export declare class BlobSource implements ByteSource {
    private blob;
    readonly name?: string | undefined;
    readonly size: number;
    readonly type?: string;
    constructor(blob: Blob, name?: string | undefined);
    read(offset: number, length: number): Promise<Uint8Array>;
    stream(offset: number, length: number): ReadableStream<Uint8Array>;
    slice(offset: number, length: number): Blob;
}
export declare class BufferSource implements ByteSource {
    readonly name?: string | undefined;
    readonly size: number;
    private bytes;
    constructor(data: ArrayBuffer | Uint8Array, name?: string | undefined);
    read(offset: number, length: number): Promise<Uint8Array>;
    stream(offset: number, length: number): ReadableStream<Uint8Array>;
}
export interface HttpSourceOptions {
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
    /** Block size used for cached range reads (default 256 KB). */
    blockSize?: number;
    /** Max cached blocks (default 128 → 32 MB). */
    maxBlocks?: number;
    onProgress?: ProgressFn;
    signal?: AbortSignal;
}
/**
 * HTTP source using Range requests. Falls back to a full download when the
 * server does not honour ranges (or CORS hides the needed headers).
 */
export declare class HttpRangeSource implements ByteSource {
    readonly url: string;
    readonly size: number;
    private opts;
    readonly name?: string | undefined;
    readonly type?: string | undefined;
    private cache;
    private inflight;
    private blockSize;
    private maxBlocks;
    private constructor();
    static open(url: string, opts?: HttpSourceOptions): Promise<ByteSource>;
    private fetchRange;
    private ensureBlocks;
    private evict;
    read(offset: number, length: number): Promise<Uint8Array>;
    stream(offset: number, length: number): ReadableStream<Uint8Array>;
}
export type DocSource = Blob | File | ArrayBuffer | Uint8Array | string | URL;
export declare function openSource(src: DocSource, opts?: HttpSourceOptions & {
    name?: string;
}): Promise<ByteSource>;
