import type { RoomLog } from './hub';
import type { Batch, Snapshot } from './protocol';
/** Minimal object storage. Keys use `/` separators. */
export interface BlobStore {
    /** null when missing */
    get(key: string): Promise<Uint8Array | null>;
    put(key: string, data: Uint8Array): Promise<void>;
    /** every key starting with `prefix` (any order) */
    list(prefix: string): Promise<string[]>;
    delete(key: string): Promise<void>;
}
export declare class MemoryBlobStore implements BlobStore {
    readonly data: Map<string, Uint8Array<ArrayBufferLike>>;
    get(key: string): Promise<Uint8Array<ArrayBufferLike> | null>;
    put(key: string, data: Uint8Array): Promise<void>;
    list(prefix: string): Promise<string[]>;
    delete(key: string): Promise<void>;
}
export interface RoomHead {
    /** changes with every upload: stale writes of an older upload are ignored */
    epoch: string;
    /** latest snapshot */
    seq: number;
    size: number;
    name: string;
    type: string;
    time: number;
}
/** a stored snapshot */
export interface Version {
    seq: number;
    size: number;
    time: number;
}
export interface RoomStoreOptions {
    /** key prefix, e.g. `collab/` */
    prefix?: string;
    /** batches are buffered and written as one segment at most this often (ms, default 250) */
    flushMs?: number;
    /** snapshots kept per room (default: all — the version history); older ones and their batches are deleted */
    keep?: number;
    /** batches below the latest snapshot loaded for clients reconnecting from older states (default 1000) */
    retain?: number;
    /** a write failed (it is retried) */
    onError?: (error: Error, room: string) => void;
}
type SnapMeta = Version & {
    sites?: number;
};
export declare class RoomStore {
    readonly blobs: BlobStore;
    private opts;
    private heads;
    private buffers;
    private queues;
    constructor(blobs: BlobStore, opts?: RoomStoreOptions);
    private dir;
    private epochDir;
    /** runs `fn` after every earlier operation on `room` */
    private run;
    private readHead;
    /** sets a room's document (snapshot 0 of a new epoch) and forgets its history */
    create(room: string, file: Uint8Array, info: {
        name: string;
        type: string;
    }): Promise<RoomHead>;
    /** latest snapshot of the room (null: no such room) */
    head(room: string): Promise<RoomHead | null>;
    /** the document of snapshot `seq` */
    file(room: string, seq: number, epoch?: string): Promise<Uint8Array | null>;
    /** snapshot `seq` with its merge context */
    snapshot(room: string, seq: number, epoch?: string): Promise<(Snapshot & SnapMeta) | null>;
    /** stored snapshots, oldest first */
    versions(room: string, epoch?: string): Promise<Version[]>;
    /** stored batches with `after` < seq ≤ `upTo` (flushed ones only), in order */
    batches(room: string, after: number, upTo?: number, epoch?: string): Promise<Batch[]>;
    /** hub `onBatch`: buffers the batch, written with the next segment */
    append(room: string, batch: Batch): void;
    /** writes buffered batches now (all rooms when `room` is omitted) */
    flush(room?: string): Promise<void>;
    private flushRoom;
    /** hub `loadLog`: the latest snapshot and the batches after it (plus `retain` before it) */
    load(room: string): Promise<RoomLog | undefined>;
    /**
     * Stores a snapshot taken from `base` (the head it was compacted from) and makes it the latest.
     * Returns the new head, or null when the room changed meanwhile (new upload, newer snapshot).
     */
    save(room: string, base: RoomHead, snap: Snapshot & {
        sites?: number;
    }, file: Uint8Array): Promise<RoomHead | null>;
    /** drops snapshots beyond `keep` and the segments no remaining snapshot needs */
    private prune;
}
export {};
