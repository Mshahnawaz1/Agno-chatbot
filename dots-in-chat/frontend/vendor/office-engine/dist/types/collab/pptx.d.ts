import type { DocumentClient } from '../core/worker/client';
import type { Methods } from '../core/worker/protocol';
import { type POp } from './pptx-ops';
import type { Adapter, ApplyResult } from './session';
export interface PptxPresence {
    k: 'pptx';
    /** slide part path */
    slide: string;
    /** selected element id */
    top?: number;
}
/** what PptxView publishes about the local selection */
export interface PptxLocalSel {
    slide: number;
    top?: number;
}
/** PptxView registers this so remote slide-list changes can close its text editing first */
export interface PptxHost {
    endEditing(): void;
}
export declare class PptxCollab implements Adapter<POp> {
    private client;
    submit?: (op: POp) => Promise<unknown>;
    nextId?: () => string;
    onPresence?: (p: PptxPresence) => void;
    private undoStack;
    private redoStack;
    /** this client's image relationship id → image key */
    private ridKey;
    private offLocal;
    constructor(client: DocumentClient);
    dispose(): void;
    private get meta();
    private path;
    private id;
    captures(method: keyof Methods): boolean;
    intercept(method: keyof Methods, args: unknown[]): Promise<unknown> | undefined;
    private pslide;
    private local;
    private history;
    transform(op: POp, prior: POp): POp | null;
    conflicts(pending: POp[], remote: POp[]): boolean;
    pessimistic(op: POp): boolean;
    prepare(ops: POp[]): void;
    apply(op: POp, kind: 'local' | 'replay' | 'remote'): Promise<ApplyResult>;
    revert(undo: unknown): Promise<void>;
}
