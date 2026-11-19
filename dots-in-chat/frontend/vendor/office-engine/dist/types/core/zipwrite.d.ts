import { type ZipArchive } from './zip';
export declare function crc32(data: Uint8Array, crc?: number): number;
export type PartData = Uint8Array | string | (() => ReadableStream<Uint8Array>);
/**
 * Re-packs an archive: unchanged entries are copied as stored (no recompression,
 * zero-copy when the source is a Blob); changed/added entries are deflated.
 * `changes`: path → new data, or null to delete.
 */
export declare function rebuildZip(zip: ZipArchive | null, changes: Map<string, PartData | null>, type?: string): Promise<Blob>;
/** Writes a new archive (all entries deflated). */
export declare function writeZip(entries: Map<string, PartData>, type?: string): Promise<Blob>;
