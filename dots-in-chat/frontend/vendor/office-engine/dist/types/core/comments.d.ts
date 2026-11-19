/**
 * Comments, the same way for every format: threads of plain-text comments kept by the worker and written into the
 * file the way Word, Excel and PowerPoint store them (DOCX `comments.xml`, XLSX threaded comments, PPTX modern
 * comments). A thread is a root comment and its replies (`parent`).
 *
 * Where a thread points: DOCX — the text marked with its id (`cm` on runs, it moves with the text); XLSX — a cell;
 * PPTX — a point on a slide.
 */
/** someone who writes or is mentioned in comments; `id`: the host app's user id, when known */
export interface CommentUser {
    name: string;
    id?: string;
    initials?: string;
}
export type CommentMention = CommentUser;
/** XLSX: a cell of the sheet stored at part `sheet`; PPTX: a point (slide px, 96 per inch) on the slide stored at part `slide` */
export type CommentAnchor = {
    sheet: string;
    r: number;
    c: number;
} | {
    slide: string;
    x: number;
    y: number;
};
export interface DocComment {
    /** durable id: the same after saving and reopening (DOCX durableId, XLSX / PPTX GUID) */
    id: string;
    /** id of the thread's root comment, for replies */
    parent?: string;
    author: CommentUser;
    /** ISO 8601 */
    time: string;
    /** plain text, lines separated by '\n'; mentions are written in it as "@Name" */
    text: string;
    /** people mentioned in `text` */
    mentions?: CommentMention[];
    /** the thread is resolved (root comments) */
    done?: boolean;
    /** where the thread points (XLSX / PPTX root comments) */
    at?: CommentAnchor;
}
/** A thread as views list it: the root, its replies in time order */
export interface CommentThread {
    root: DocComment;
    replies: DocComment[];
}
/** the threads of a comment list (replies whose root is gone are left out), roots in list order */
export declare function threadsOf(list: Iterable<DocComment>): CommentThread[];
/**
 * The people `text` mentions ("@Name"), among `people` (formats that keep no mention of their own — DOCX, PPTX — list
 * the people mentioned with the authors, and get the mentions back this way when the file is read again)
 */
export declare function mentionsIn(text: string, people: CommentUser[]): CommentUser[] | undefined;
/** initials for an avatar: "Ann Lee" → "AL" */
export declare function initialsOf(name: string): string;
/** a GUID the way Office writes them: {8-4-4-4-12}, upper case */
export declare function newGuid(): string;
/** a DOCX durable id: 8 hex digits, below 0x7FFFFFFF as Word requires */
export declare function newDurableId(): string;
/** a new comment id for a document of `kind` */
export declare function newCommentId(kind: 'docx' | 'xlsx' | 'pptx'): string;
/** `c` with only well-formed fields (it may come from a collaborator); null when it is not a comment */
export declare function checkedComment(c: unknown): DocComment | null;
/** ISO time without milliseconds (what Office writes) */
export declare const nowIso: () => string;
/**
 * The comments of a document as the worker keeps them. Formats keep what they need to write a comment back as it was
 * read (`orig`) and mark what changed.
 */
export declare class CommentStore<Orig = unknown> {
    readonly map: Map<string, DocComment>;
    /** what each comment was read from (formats write untouched comments back from it) */
    readonly orig: Map<string, Orig>;
    /** comments that changed since the document was opened */
    readonly touched: Set<string>;
    /** set once anything changed */
    dirty: boolean;
    /** every change (the engine tells the views) */
    onChange?: (id: string, c: DocComment | null) => void;
    list(): DocComment[];
    get(id: string): DocComment | undefined;
    /** sets (null: deletes) comment `id`; returns what it was */
    set(id: string, c: DocComment | null): DocComment | null;
    /** whether `c` is the comment as read (not changed since) */
    pristine(id: string): boolean;
    /** the thread roots, and the replies of each root that is there, in time order */
    threads(): CommentThread[];
}
