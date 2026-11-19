import { type Entry, type PeerInfo, type UserInfo } from './protocol';
import type { Transport } from './transport';
export interface ApplyResult {
    /** whatever `revert` needs to undo the op exactly (local ops only) */
    undo?: unknown;
    /** returned to the caller of `submit` */
    result?: unknown;
}
export type ApplyKind = 'local' | 'replay' | 'remote';
export interface Adapter<Op> {
    /** resolves when the document can take operations (e.g. fully loaded) */
    ready?(): Promise<void>;
    /**
     * `op` adjusted to apply after `prior`, a concurrent op of another site that was sequenced first.
     * Must be deterministic; return `op` itself when unaffected, null to drop it.
     */
    transform(op: Op, prior: Op): Op | null;
    /**
     * Async work before ops get applied (fetching resources, waiting for IME composition to end…),
     * so that `revert` / `apply` during a rebase can run without yielding to user input.
     */
    prepare?(ops: Op[]): Promise<void> | void;
    /** applies `op` to the local document */
    apply(op: Op, kind: ApplyKind): Promise<ApplyResult> | ApplyResult;
    /** exactly undoes a pending local op (given its `undo` token) */
    revert(undo: unknown): Promise<void> | void;
    /** op must be sequenced by the hub before it is applied */
    pessimistic?(op: Op): boolean;
    /** whether remote ops interact with pending local ones (default: true → rebase) */
    conflicts?(pending: Op[], remote: Op[]): boolean;
    /** after a remote batch / rebase was applied (views refresh here) */
    settled?(): void;
}
export type CollabStatus = 'connecting' | 'syncing' | 'live' | 'offline' | 'error';
export interface SessionEvents {
    status: CollabStatus;
    peers: PeerInfo[];
    /** remote changes were applied */
    change: void;
    error: Error;
}
export interface SessionOptions {
    room: string;
    user: UserInfo;
    /** canonical batches kept to transform late batches (default 5000) */
    logWindow?: number;
    /** sequence number the opened file already contains: a snapshot (default 0, the original upload) */
    base?: number;
}
export declare class CollabSession<Op = unknown> {
    private transport;
    private adapter;
    private opts;
    site: number;
    /** last applied sequence number */
    rev: number;
    status: CollabStatus;
    error?: string;
    readonly peers: Map<number, PeerInfo>;
    private log;
    private inflight;
    private buffer;
    private queue;
    private joined;
    private online;
    private counter;
    private listeners;
    private presence;
    private presenceTimer?;
    private presenceAt;
    private closed;
    constructor(transport: Transport, adapter: Adapter<Op>, opts: SessionOptions);
    /** local ops not yet confirmed by the hub */
    get pending(): number;
    /** a unique id for ops created by this client */
    nextId(): string;
    /** applies a local op (through the adapter) and shares it; resolves with the adapter's result */
    submit(op: Op): Promise<unknown>;
    /** registers a local op the caller already applied (synchronously); `undo` reverts it */
    push(op: Op, undo: unknown): void;
    setPresence(data: unknown): void;
    on<K extends keyof SessionEvents>(event: K, fn: (d: SessionEvents[K]) => void): () => void;
    /** the last `limit` batches as applied here (the context of a snapshot taken at `rev`) */
    context(limit?: number): Entry<Op>[];
    /** resolves once everything queued so far was processed */
    idle(): Promise<void>;
    close(): void;
    private emit;
    private setStatus;
    private fail;
    private enqueue;
    private onMessage;
    private onBatch;
    /** batch ops transformed against the concurrent batches sequenced before it */
    private canonical;
    private revertAll;
    /** `answers`: where the answer to the caller of a pessimistic op goes, for `ack` to give it at the right time */
    private replay;
    /**
     * The adapter's async work before `ops` are applied. A failure doesn't stop the session (a batch that can't be
     * processed would block the room for good: everyone replays it): `apply` then fails for the op concerned and only
     * that op is lost.
     */
    private prepare;
    private remote;
    private applyRemote;
    /** our in-flight batch was sequenced */
    private ack;
    private flush;
}
