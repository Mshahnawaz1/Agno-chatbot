/**
 * Real-time collaboration for office-engine documents.
 *
 *   const collab = startCollab(client, { transport: 'wss://host/collab', room: 'doc-42', user: { name: 'Ann' } })
 *   collab.on('status', console.log)
 *   collab.close()
 *
 * Every participant must open the same base file; the hub keeps the operation log on top of it.
 * DocViewer does all of this through its `collab` prop.
 */
import type { DocumentClient } from '../core/worker/client';
import { type PeerView } from './hosts';
import type { PeerInfo, UserInfo } from './protocol';
import { CollabSession, type CollabStatus, type SessionEvents } from './session';
import { type Transport } from './transport';
export interface CollabOptions {
    /** hub connection: a WebSocket URL or any Transport */
    transport: Transport | string;
    /** shared document id */
    room: string;
    user: UserInfo;
    /**
     * Sequence number of the snapshot `src` was opened from (see `compact`); default 0, the original
     * upload. The hub then only sends the batches after it.
     */
    base?: number;
}
export interface Collab {
    readonly session: CollabSession<unknown>;
    readonly status: CollabStatus;
    /** collaborators currently connected (without the local user) */
    readonly peers: PeerInfo[];
    /** local operations not yet confirmed by the hub */
    readonly pending: number;
    on<K extends keyof SessionEvents>(event: K, fn: (d: SessionEvents[K]) => void): () => void;
    /** screen rectangles of a collaborator's DOCX selection (for custom overlays) */
    rects(root: HTMLElement, peer: PeerView): {
        caret: DOMRect | null;
        sel: DOMRect[];
    } | null;
    close(): void;
}
export declare function startCollab(client: DocumentClient, opts: CollabOptions): Collab;
export { CollabHub, type HubOptions, type HubConnection, type RoomLog, type RoomState } from './hub';
export { compact, type CompactOptions } from './compact';
export { RoomStore, MemoryBlobStore, type BlobStore, type RoomHead, type RoomStoreOptions, type Version } from './store';
export { CollabSession, type Adapter, type CollabStatus } from './session';
export { MemoryTransport, WebSocketTransport, type Transport, type TransportStatus } from './transport';
export type { Batch, ClientMsg, Entry, HubMsg, PeerInfo, Snapshot, UserInfo } from './protocol';
export { encode, decode } from './codec';
