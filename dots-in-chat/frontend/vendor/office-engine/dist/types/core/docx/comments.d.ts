/**
 * DOCX comments: `word/comments.xml` (the comments), `commentsExtended.xml` (threads: reply → parent, resolved),
 * `commentsIds.xml` (durable ids), `commentsExtensible.xml` (UTC dates) and `people.xml` (authors).
 *
 * In the body a comment covers the text between `commentRangeStart` and `commentRangeEnd` of its id, followed by a run
 * holding its `commentReference`. Paragraph models carry that as `cm` (thread root ids) on the runs it covers, so it
 * follows the text through every edit. Generated paragraphs mark their own part of each range (with the root id as
 * `cm:<id>`); `fixCommentMarks` then turns the marks of the whole body into one range per thread when the document is
 * saved, with the replies' ranges at the same place, as Word writes them.
 */
import { CommentStore } from '../comments';
import { type OpcPackage, type Rels } from '../opc';
/** what a comment was read from */
export interface DocxCommentOrig {
    /** w:id in the file */
    num: number;
    /** its <w:comment> element, as read */
    xml: string;
    text: string;
    /** w14:paraId of its last paragraph */
    paraId?: string;
}
export declare class DocxComments extends CommentStore<DocxCommentOrig> {
    /** w:id in the file → comment id */
    readonly byNum: Map<number, string>;
    /** w:id given to comments that were not read from the file */
    readonly nums: Map<string, number>;
    /** thread roots whose range was found in the body when it was read */
    readonly inBody: Set<string>;
    /** start tag of the comments part as read (its namespace declarations) */
    rootTag?: string;
    /** the parts were found in the package (paths) */
    paths: {
        comments?: string;
        ex?: string;
        ids?: string;
        ext?: string;
        people?: string;
    };
    /** w:id of a comment in the body while reading → its thread root (replies mark nothing themselves) */
    rootOfNum(num: string | undefined): string | undefined;
}
export declare function readDocxComments(pkg: OpcPackage, mainPath: string, rels: Rels): Promise<DocxComments>;
/** what the save of the body found: thread roots with a range in it */
export interface FixResult {
    xml: string;
    found: Set<string>;
}
/**
 * One range per thread in body XML: the first start and the last end of each root's marks stay (the replies' marks
 * join them there), every other mark goes, so do the marks of comments that are no longer there. `num` gives each
 * comment its w:id in the saved file.
 */
export declare function fixCommentMarks(xml: string, store: DocxComments, num: (id: string) => number): FixResult;
/** the start / end marks and reference run a generated paragraph puts around its part of a thread's range */
export declare const markStart: (W: string, id: string) => string;
export declare const markEnd: (W: string, id: string) => string;
/**
 * w:id of every comment in the saved file: those read keep theirs, new ones come after (and keep the one they got
 * for later saves, whose body is read back from the first)
 */
export declare function numbering(store: DocxComments): (id: string) => number;
/** the comments of the thread roots `keep` (and of what the body never had), written into the package */
export declare function writeDocxComments(pkg: OpcPackage, mainPath: string, store: DocxComments, num: (id: string) => number, found: Set<string>): Promise<void>;
/** the comment ids a block list marks (roots), in document order */
export declare function markedIds(runs: {
    cm?: string[];
}[], into?: string[]): string[];
