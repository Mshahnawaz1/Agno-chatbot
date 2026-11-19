import type { Part } from '../../iwork/ooxml';
import type { DocModel } from './model';
import { Pictures } from './pictures';
export type StoryKind = 'main' | 'hdr' | 'ftn' | 'edn' | 'atn' | 'txbx';
/** Writes stories as WordprocessingML (their pictures and links are relationships of `part`). */
export declare class Writer {
    readonly m: DocModel;
    part: Part;
    readonly pics: Pictures;
    private revId;
    private fmtCache;
    /** XML put before the character at a CP (bookmarks, comment ranges) */
    private marks;
    private markCps;
    private pending;
    private noteRefs;
    private commentRefs;
    private depth;
    private contentWidth;
    constructor(m: DocModel, part: Part);
    private addMark;
    /** w:ins / w:del start tag of a revision key */
    revTag(rev: string): string;
    /** the run formatting of a segment in a paragraph of style `style` */
    private fmt;
    private paraOf;
    /** the paragraphs of [cp0, cp1) */
    private paras;
    private fieldsOf;
    /** WordprocessingML blocks of a story */
    story(cp0: number, cp1: number, kind: StoryKind, sectPrs?: Map<number, string>): string;
    private isCellEnd;
    private isRowEnd;
    private table;
    /** the blocks of a cell: up to its cell mark */
    private cell;
    private tableXml;
    /** marks (bookmarks, comment ranges) of a paragraph that is not written (a row end) move to the next one */
    private skip;
    private marksIn;
    private paragraph;
    /** numId of an LFO index (0: not a list) */
    numId(ilfo: number): number;
    /** the list level a paragraph's indents come from */
    lvlOf(ilfo: number, ilvl: number): import("./styles").Lvl | undefined;
    private hidden;
    private inInstr;
    private plain;
    private special;
    private closeField;
}
