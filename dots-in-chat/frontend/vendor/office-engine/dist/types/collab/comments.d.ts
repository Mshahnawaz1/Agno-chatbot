/**
 * Comments in a shared room: setting a comment (adding, editing, resolving, deleting) is one operation, the same for
 * every format. Comments are independent of each other and only change whole, so applying them in hub order is all it
 * takes; the last one sequenced wins. XLSX comments point at a cell, so inserted / deleted rows and columns move them
 * (see `transformX`).
 */
import type { DocComment } from '../core/comments';
import type { DocumentClient } from '../core/worker/client';
import type { ApplyResult } from './session';
export interface CommentOp {
    t: 'comment';
    /** op id (XLSX ops carry one) */
    id?: string;
    cid: string;
    c: DocComment | null;
}
export declare const isCommentOp: (op: unknown) => op is CommentOp;
export declare function applyComment(client: DocumentClient, op: CommentOp): Promise<ApplyResult>;
/** reverts a comment op (its undo token); false when `undo` is not one */
export declare function revertComment(client: DocumentClient, undo: unknown): Promise<void> | false;
