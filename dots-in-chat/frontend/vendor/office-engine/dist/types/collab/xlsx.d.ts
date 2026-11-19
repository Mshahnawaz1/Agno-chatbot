/**
 * XLSX collaboration (main thread): turns the view's worker calls into shared operations.
 * Cell edits, formatting, layout, fill / sort / replace are applied optimistically; inserting /
 * deleting rows or columns and sheet-list changes wait for the hub's order. Undo / redo only
 * touch the local user's own operations (shared as `revert` operations).
 */
import type { DocumentClient } from '../core/worker/client';
import type { Methods } from '../core/worker/protocol';
import type { Range } from '../core/xlsx/types';
import type { Adapter, ApplyResult } from './session';
import { type XOp } from './xlsx-ops';
export interface XlsxPresence {
    k: 'xlsx';
    /** sheet part path */
    sheet: string;
    /** selected range and active cell */
    range: Range;
    ar: number;
    ac: number;
}
/** what XlsxView publishes about the local selection */
export interface XlsxLocalSel {
    sheet: number;
    range: Range;
    ar: number;
    ac: number;
}
export declare class XlsxCollab implements Adapter<XOp> {
    private client;
    submit?: (op: XOp) => Promise<unknown>;
    nextId?: () => string;
    onPresence?: (p: XlsxPresence) => void;
    private undoStack;
    private redoStack;
    private offLocal;
    constructor(client: DocumentClient);
    dispose(): void;
    private get meta();
    private path;
    private id;
    captures(method: keyof Methods): boolean;
    intercept(method: keyof Methods, args: unknown[]): Promise<unknown> | undefined;
    private pbook;
    private local;
    private history;
    transform(op: XOp, prior: XOp): XOp | null;
    conflicts(pending: XOp[], remote: XOp[]): boolean;
    pessimistic(op: XOp): boolean;
    apply(op: XOp, kind: 'local' | 'replay' | 'remote'): Promise<ApplyResult>;
    revert(undo: unknown): Promise<void>;
}
