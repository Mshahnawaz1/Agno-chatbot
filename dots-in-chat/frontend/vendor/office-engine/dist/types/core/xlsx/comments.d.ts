/**
 * XLSX comments: threaded comments (`xl/threadedComments/*.xml`, authors in `xl/persons/person.xml`) and, for every
 * thread, the legacy comment Excel keeps next to it (`xl/comments*.xml` + its VML shape) so older readers show it too.
 * Notes (legacy comments without a thread) are read as one-comment threads; once a note is answered or changed it is
 * written as a threaded comment, with an id derived from where it was so it keeps that id.
 */
import { CommentStore } from '../comments';
import { type OpcPackage, type Rels } from '../opc';
import type { SheetInfo } from './types';
interface Person {
    id: string;
    name: string;
    userId?: string;
    providerId?: string;
}
/** what a comment was read from: a note keeps its own element (rich text) and author */
interface XlsxOrig {
    sheet: string;
    note?: {
        xml: string;
        author: string;
        text: string;
    };
}
export declare class XlsxComments extends CommentStore<XlsxOrig> {
    /** persons as read (and added), by GUID */
    readonly persons: Map<string, Person>;
    personsPath?: string;
    /** sheet path → its comment parts as found / written (`linked`: the sheet's <legacyDrawing> was added here) */
    readonly parts: Map<string, {
        threaded?: string;
        legacy?: string;
        vml?: string;
        vmlRid?: string;
        linked?: boolean;
    }>;
}
export declare function readXlsxComments(pkg: OpcPackage, wbPath: string, wbRels: Rels, sheets: SheetInfo[]): Promise<XlsxComments>;
/**
 * Writes the comments of every sheet that has (or had) some: threaded comments, persons, the legacy comments with their
 * VML. Sheets that keep no comment lose those parts.
 */
export declare function writeXlsxComments(pkg: OpcPackage, wbPath: string, store: XlsxComments, sheets: SheetInfo[]): Promise<void>;
export {};
