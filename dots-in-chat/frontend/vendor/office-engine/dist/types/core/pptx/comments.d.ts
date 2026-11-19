/**
 * PPTX comments: modern comments (`ppt/comments/modernComment_*.xml` per slide, authors in `ppt/authors.xml`) with
 * replies and resolved state; legacy comments (`ppt/comments/comment*.xml`, `ppt/commentAuthors.xml`) are read as
 * one-comment threads. A slide's comments are written back as modern comments only (PowerPoint repairs a file that has
 * both for the same slide).
 *
 * A thread points at a point of its slide, in slide pixels (96 per inch, as the slide model).
 */
import { CommentStore } from '../comments';
import { type OpcPackage, type Rels } from '../opc';
interface Author {
    id: string;
    name: string;
    initials?: string;
    userId?: string;
    providerId?: string;
}
/** what a modern comment was read from: its anchor and position as written (they may point at a shape) */
interface PptxOrig {
    slide: string;
    anchor?: string;
    pos?: string;
    /** the position read, in slide px (the anchor is written back while the thread stays there) */
    x?: number;
    y?: number;
}
export declare class PptxComments extends CommentStore<PptxOrig> {
    readonly authors: Map<string, Author>;
    authorsPath?: string;
}
export declare function readPptxComments(pkg: OpcPackage, presRels: Rels, slides: {
    path: string;
}[], size: {
    w: number;
    h: number;
}): Promise<PptxComments>;
/** writes the comments of every slide that has (or had) some, as modern comments */
export declare function writePptxComments(pkg: OpcPackage, presPath: string, store: PptxComments, slides: {
    path: string;
}[]): Promise<void>;
/** the comment parts of a slide (left out of a copy of it, removed with it) */
export declare function isCommentRel(type: string): boolean;
export declare const COMMENT_EXT_RE: RegExp;
export {};
