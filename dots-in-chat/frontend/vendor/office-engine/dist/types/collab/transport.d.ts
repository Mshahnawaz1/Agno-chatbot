import type { CollabHub } from './hub';
import type { ClientMsg, HubMsg } from './protocol';
export type TransportStatus = 'connecting' | 'open' | 'closed';
/** Message pipe to a hub. Implement it to plug collaboration into your own backend. */
export interface Transport {
    connect(): void;
    send(msg: ClientMsg): void;
    close(): void;
    onMessage?: (msg: HubMsg) => void;
    onStatus?: (s: TransportStatus) => void;
}
/** WebSocket transport with automatic reconnection (exponential backoff). */
export declare class WebSocketTransport implements Transport {
    private url;
    private protocols?;
    onMessage?: (msg: HubMsg) => void;
    onStatus?: (s: TransportStatus) => void;
    private ws?;
    private closed;
    private retry;
    private timer?;
    constructor(url: string, protocols?: string | string[] | undefined);
    connect(): void;
    private open;
    send(msg: ClientMsg): void;
    close(): void;
}
/**
 * In-process transport to a `CollabHub` (tests, demos with several viewers on one page).
 * Messages go through the JSON codec and are delivered asynchronously, optionally with latency.
 */
export declare class MemoryTransport implements Transport {
    private hub;
    private latency;
    onMessage?: (msg: HubMsg) => void;
    onStatus?: (s: TransportStatus) => void;
    private conn?;
    private up;
    private down;
    constructor(hub: CollabHub, latency?: number | (() => number));
    private delay;
    connect(): void;
    send(msg: ClientMsg): void;
    /** simulates a dropped connection (messages in flight are lost) */
    drop(): void;
    close(): void;
}
