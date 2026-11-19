import { type Batch, type ClientMsg, type Entry, type HubMsg, type PeerInfo, type Snapshot } from './protocol';
export interface RoomState {
    id: string;
    seq: number;
    /** every batch with seq > `start`, in order */
    log: Batch[];
    /** batches older than this were dropped (after a snapshot) */
    start: number;
    ids: Set<string>;
    peers: Map<number, {
        info: PeerInfo;
        send: (m: HubMsg) => void;
    }>;
    nextSite: number;
    /** snapshots clients can join from: seq → context */
    snaps: Map<number, Entry[]>;
}
/** A persisted room: its latest snapshot and the batches after it (and possibly some before). */
export interface RoomLog {
    log: Batch[];
    snapshot?: Snapshot & {
        sites?: number;
    };
}
type Loaded = Batch[] | RoomLog | undefined;
export interface HubOptions {
    /** called for every sequenced batch (persist it to rebuild rooms after a restart) */
    onBatch?: (room: string, batch: Batch) => void;
    /** rebuilds a room (e.g. from storage) the first time it is used */
    loadLog?: (room: string) => Loaded | Promise<Loaded>;
    /** called when the last peer left a room */
    onIdle?: (room: string) => void;
    /** batches kept below the latest snapshot for clients reconnecting from older states (default 1000) */
    retain?: number;
    /** most recent snapshots clients can still join from (default 3) */
    keep?: number;
}
export interface HubConnection {
    receive(msg: ClientMsg): void;
    close(): void;
}
export declare class CollabHub {
    private opts;
    readonly rooms: Map<string, RoomState>;
    private loading;
    constructor(opts?: HubOptions);
    /** the room, loaded through `loadLog` the first time */
    room(id: string): Promise<RoomState>;
    /** forgets a room (its log and peers) — e.g. when a new base file is uploaded */
    reset(id: string): void;
    /** drops an idle room from memory (it is loaded again on the next join); false while peers are connected */
    unload(id: string): boolean;
    /**
     * Registers a snapshot of a loaded room (`compact` output, its file stored where clients can open
     * it): clients may join from it, and batches older than `retain` below it are dropped.
     * Returns false when the snapshot doesn't fit the room (e.g. it was reset meanwhile).
     */
    snapshot(id: string, snap: Snapshot): boolean;
    connect(send: (m: HubMsg) => void): HubConnection;
}
export {};
