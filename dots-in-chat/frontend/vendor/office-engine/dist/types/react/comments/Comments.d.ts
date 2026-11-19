import { type CommentAnchor, type CommentThread, type CommentUser, type DocComment } from '../../core/comments';
import type { DocKind } from '../../core/opc';
import type { DocumentClient } from '../../core/worker/client';
export interface CommentOptions {
    /** who writes the comments made here (default: the collaboration user, else "Me") */
    user?: CommentUser;
    /** who can be @mentioned: a list, or a function of what was typed after "@" */
    mentions?: CommentUser[] | ((query: string) => CommentUser[] | Promise<CommentUser[]>);
    /** whether comments can be added, answered and resolved here (default: while editing) */
    canComment?: boolean;
    /** each comment change made here (not those of collaborators): notify the people mentioned, log activity… */
    onEvent?: (e: CommentEvent) => void;
    /** open the comments panel when the document opens */
    open?: boolean;
    /** a thread (or a comment of it) to show when the document opens: the panel opens on it and the document scrolls to it */
    focus?: string;
}
export type CommentAction = 'add' | 'reply' | 'edit' | 'delete' | 'resolve' | 'reopen';
export interface CommentEvent {
    type: CommentAction;
    /** the comment added / changed / deleted (the thread's root for resolve / reopen) */
    comment: DocComment;
    /** the root of its thread */
    thread: DocComment;
    /** people mentioned by this change: all of a new comment's, the ones an edit added */
    mentioned: CommentUser[];
    /** the people who wrote the thread's other comments (once each, not the one who made this change) */
    participants: CommentUser[];
    /** what the thread points at: the commented text (DOCX), "Sheet1!B3" (XLSX), "Slide 3" (PPTX) */
    quote: string;
}
/** where a thread being written would go */
export interface PendingComment {
    quote: string;
    /** XLSX / PPTX: the thread's anchor */
    at?: CommentAnchor;
    /** DOCX: the range to mark (view-specific) */
    range?: unknown;
    /** the place already has a thread (XLSX cell): commenting answers it */
    existing?: string;
}
export interface PlacedThread extends CommentThread {
    quote: string;
}
/** what a view tells the comments panel */
export interface CommentHost {
    kind: DocKind;
    /** where a new thread would go now; null when there is nothing to comment on */
    pending(): PendingComment | null;
    /** puts a new thread in place (DOCX marks its text); false when it can't */
    attach?(id: string, p: PendingComment): boolean | Promise<boolean>;
    /** the threads that have a place in the document, in document order */
    placed(threads: CommentThread[]): PlacedThread[];
    /** shows thread `id`'s place */
    reveal(id: string): void;
    /** what to do to comment, when `pending()` finds nothing */
    hint: string;
}
export interface CommentsState {
    rev: number;
    open: boolean;
    /** thread shown as the current one (its place highlighted) */
    active: string | null;
    /** a new thread being written */
    draft: PendingComment | null;
    showResolved: boolean;
    /** message about the last action that failed, or why a thread can't be started */
    notice: string | null;
}
export declare class CommentsCtl {
    readonly client: DocumentClient;
    readonly list: Map<string, DocComment>;
    state: CommentsState;
    host: CommentHost | null;
    opts: CommentOptions;
    me: CommentUser;
    canComment: boolean;
    loaded: boolean;
    private subs;
    private offs;
    private touchTimer?;
    private placedCache;
    constructor(client: DocumentClient);
    dispose(): void;
    subscribe: (fn: () => void) => () => void;
    snapshot: () => CommentsState;
    private set;
    /** the document changed: places and quotes are looked up again (soon, not on every keystroke) */
    touch(): void;
    setHost(h: CommentHost | null): void;
    /** the threads with a place in the document, in document order (resolved ones too) */
    threads(): PlacedThread[];
    /** threads shown in the document (not resolved) */
    visible(): PlacedThread[];
    isMine(c: DocComment): boolean;
    toggle(open?: boolean): void;
    /** makes thread `id` the current one; `reveal`: scroll the document to it */
    select(id: string | null, reveal?: boolean): void;
    /** starts a new thread on the selection (or at `at`); false (with a notice) when there is nothing to comment on */
    start(at?: PendingComment): boolean;
    cancelDraft(): void;
    dismiss(): void;
    setShowResolved(on: boolean): void;
    private author;
    private write;
    private quoteOf;
    /** authors of the comments of thread `root` other than `except` and this user, once each */
    private participants;
    private emit;
    /** posts the thread being written */
    post(text: string, mentions: CommentUser[]): Promise<boolean>;
    reply(rootId: string, text: string, mentions: CommentUser[]): Promise<boolean>;
    edit(id: string, text: string, mentions: CommentUser[]): Promise<boolean>;
    /** deletes a comment; deleting a thread's root deletes the thread */
    remove(id: string): Promise<boolean>;
    resolve(id: string, done: boolean): Promise<boolean>;
    /** people matching what was typed after "@" */
    people(query: string): Promise<CommentUser[]>;
}
export declare const CommentsContext: import("react").Context<CommentsCtl | null>;
export declare const useCommentsCtl: () => CommentsCtl | null;
/** the comments state, re-rendering on every change */
export declare function useCommentsState(ctl: CommentsCtl | null): CommentsState;
/** CSS that highlights the threads' places: `[data-cm~="id"]` inside `scope` */
export declare function markCss(scope: string, ids: string[], active: string | null): string;
