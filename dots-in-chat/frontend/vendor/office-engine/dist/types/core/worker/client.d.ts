import type { DocKind } from '../opc';
import type { DocSource } from '../source';
import type { Events, Methods, OpenParams, OpenResult } from './protocol';
export interface OpenOptions extends OpenParams {
    /** Custom worker factory (e.g. for strict CSP setups). Pass `false` to run on the main thread. */
    worker?: (() => Worker) | false;
    /** Download / parse progress, including progress emitted while opening. */
    onProgress?: (p: Events['progress']) => void;
}
type Listener<K extends keyof Events> = (data: Events[K]) => void;
/** Registers the worker factory used when none is passed to `DocumentClient.open`. */
export declare function setDefaultWorker(factory: () => Worker): void;
/**
 * Main-thread handle to a document living in a Web Worker.
 * Parsing, unzipping and formatting never block the UI thread.
 */
export declare class DocumentClient {
    kind: DocKind;
    name?: string;
    size: number;
    info: OpenResult;
    private worker?;
    private engine?;
    private seq;
    private pending;
    private listeners;
    private urls;
    private destroyed;
    private constructor();
    static open(src: DocSource, opts?: OpenOptions): Promise<DocumentClient>;
    private onMessage;
    /**
     * Set by a collaboration session: sees every call first and handles the ones that change the
     * document (returns a promise), or returns undefined to let the call through unchanged.
     */
    interceptor?: (method: keyof Methods, args: unknown[]) => Promise<unknown> | undefined;
    call<M extends keyof Methods>(method: M, ...args: Parameters<Methods[M]>): Promise<ReturnType<Methods[M]>>;
    /** calls the engine directly, bypassing `interceptor` */
    direct<M extends keyof Methods>(method: M, ...args: Parameters<Methods[M]>): Promise<ReturnType<Methods[M]>>;
    /** dispatches an event to listeners on this thread (e.g. remote changes applied by a collaboration session) */
    notify<K extends keyof Events>(event: K, data: Events[K]): void;
    on<K extends keyof Events>(event: K, fn: Listener<K>): () => void;
    /** Object URL for a package part (images, media). Cached per client; revoked on destroy. */
    mediaUrl(path: string): Promise<string>;
    static canRender(path: string): boolean;
    destroy(): void;
}
export {};
