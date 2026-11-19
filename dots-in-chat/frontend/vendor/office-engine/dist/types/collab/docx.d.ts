/**
 * DOCX collaboration: operations on the main-thread paragraph model (DocxEditor),
 * which mirrors every change to the worker itself.
 *
 *  - `text`   splice inside one paragraph (typing, deleting, inline formatting) — merges
 *             character-wise with concurrent edits of the same paragraph
 *  - `paras`  contiguous paragraphs replaced (Enter, join, paste, paragraph formatting…) — last writer wins
 *  - `blocks` top-level blocks replaced (tables)
 *  - `image` / `link`  package resources, shared by key (relationship ids differ per client)
 *  - `call`   other document-level worker calls (adding a built-in style, giving a style another look), run in hub order
 *  - `comment` a comment set / deleted (its range is marked in the text, shared with the text)
 */
import type { Block, Inline, Paragraph } from '../core/docx/types';
import type { DocumentClient } from '../core/worker/client';
import type { Methods } from '../core/worker/protocol';
import type { DocState, DocxEditor } from '../react/docx/DocxEditor';
import type { Adapter, ApplyResult } from './session';
import { type CommentOp } from './comments';
export interface DocxHost {
    editor: DocxEditor;
    st: DocState;
}
/** top-level block identity: paragraph id, or table (regenerated id / original body item) */
export type BKey = {
    p: number;
} | {
    tid?: number;
    item?: number;
};
export type DocxOp = {
    t: 'text';
    pid: number;
    at: number;
    del: number;
    ins: Inline[];
} | {
    t: 'paras';
    before: number[];
    next: Paragraph[];
} | {
    t: 'blocks';
    before: BKey[];
    prev: BKey | null;
    next: Block[];
} | {
    t: 'image';
    key: string;
    bytes: Uint8Array;
    ext: string;
} | {
    t: 'link';
    key: string;
    url: string;
} | {
    t: 'call';
    method: string;
    args: unknown[];
} | CommentOp;
/** a point in the document that survives structural edits: paragraph id, page-break part, offset */
export interface DPos {
    pid: number;
    k: number;
    o: number;
}
export interface DocxPresence {
    k: 'docx';
    a: DPos;
    f: DPos;
}
/** where a paragraph removed on its own stood: its index in the body (tables around it), or in a cell of table `tbl` */
interface Home {
    index: number;
    cell?: {
        tbl: BKey;
        ri: number;
        ci: number;
    };
    prevT?: BKey;
    nextT?: BKey;
}
/**
 * How to undo one model change; `paras` with an empty `next` re-inserts `before` next to a paragraph it had as a
 * neighbour, else at its `home`.
 */
type Step = {
    t: 'paras';
    before: Paragraph[];
    next: Paragraph[];
    prev?: {
        pid: number;
        k: number;
    };
    after?: {
        pid: number;
        k: number;
    };
    home?: Home;
} | {
    t: 'blocks';
    before: Block[];
    next: Block[];
    prev: BKey | null;
};
/** the steps of an op, undone in reverse order */
type Undo = Step[] | null;
/** whether a `call` op is one the document-level edits make: the method is shared, the arguments are its kind */
export declare function isSharedCall(method: unknown, args: unknown): method is keyof Methods;
/** single replaced range between two run lists (common prefix / suffix, formatting included) */
export declare function diffRuns(a: Inline[], b: Inline[]): {
    at: number;
    del: number;
    ins: Inline[];
} | null;
export declare function spliceRuns(runs: Inline[], at: number, del: number, ins: Inline[]): Inline[];
export declare class DocxCollab implements Adapter<DocxOp> {
    private client;
    private host?;
    /** > 0 while this adapter drives the editor (its commits are not local ops) */
    private suppress;
    /** resource key → this client's value ({ rid, path } for images, link key for links) */
    private res;
    /** this client's rid / link key → resource key */
    private resKey;
    private results;
    private snap;
    /** the model was changed since the last `settled` */
    private touchedModel;
    private site;
    private counter;
    private offHost?;
    /** sends presence (set by the session owner) */
    onPresence?: (p: DocxPresence) => void;
    private lastPresence;
    private raf;
    /** registers a local op the editor already applied */
    push?: (op: DocxOp, undo: Undo) => void;
    /** shares a local op through the session (applied by `apply`) */
    submit?: (op: DocxOp) => Promise<unknown>;
    constructor(client: DocumentClient);
    ready(): Promise<void>;
    /** gives this client its own range of paragraph / table ids */
    setSite(site: number): void;
    private allocPids;
    dispose(): void;
    captures(method: keyof Methods): boolean;
    /** client.call interceptor: package resources and document-level calls become ops */
    intercept(method: keyof Methods, args: unknown[]): Promise<unknown> | undefined;
    private key;
    private get st();
    private get ed();
    /** every block of paragraph `pid` (page-break parts) with its address */
    private locate;
    private topIndex;
    /** contiguous paragraph addresses from the first block of pids[0], following `pids` */
    private region;
    private remap;
    /** tags runs referring to resources this client created, so others can map them */
    private tag;
    private fetchRes;
    private onCommit;
    transform(op: DocxOp, prior: DocxOp): DocxOp | null;
    private touched;
    conflicts(pending: DocxOp[], remote: DocxOp[]): boolean;
    pessimistic(op: DocxOp): boolean;
    prepare(ops: DocxOp[]): Promise<void>;
    apply(op: DocxOp, kind: 'local' | 'replay' | 'remote'): Promise<ApplyResult>;
    /** where the paragraph at `loc` stands, for a revert that finds no paragraph next to it */
    private home;
    /** the address a paragraph that stood at `h` gets now */
    private homePa;
    /** applies a model op through the editor; returns how to revert it */
    private run;
    revert(undo: unknown): Promise<void> | undefined;
    private undoStep;
    private toD;
    private fromD;
    /** remembers the selection (by paragraph id + text) before the model changes */
    private capture;
    /** the remembered selection in the current model */
    private sel;
    settled(): void;
    private onSel;
    /** screen rectangles of a collaborator's selection (caret = last rect) inside `root` */
    rects(root: HTMLElement, p: DocxPresence): {
        caret: DOMRect | null;
        sel: DOMRect[];
    };
}
export {};
