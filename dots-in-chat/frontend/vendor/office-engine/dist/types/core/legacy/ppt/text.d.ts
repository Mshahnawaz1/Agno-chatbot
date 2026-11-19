/**
 * PowerPoint text ([MS-PPT] 2.9): the characters of a text (TextCharsAtom / TextBytesAtom, paragraphs end with
 * CR), its paragraph and character runs (StyleTextPropAtom: TextPFException / TextCFException), the master text
 * styles (TxMasterStyleAtom, per text type and indent level), rulers, fields and hyperlinked ranges.
 */
import { Rec } from './records';
/** paragraph properties (lengths in master units, 576 per inch) */
export interface PF {
    bullet?: boolean;
    bulletHasFont?: boolean;
    bulletHasColor?: boolean;
    bulletHasSize?: boolean;
    bulletChar?: number;
    bulletFont?: number;
    /** percent of the text size (negative: points) */
    bulletSize?: number;
    /** ColorIndexStruct */
    bulletColor?: number;
    /** 0 left, 1 center, 2 right, 3 justify, 4 distributed, 5 Thai distributed, 6 justify low */
    align?: number;
    /** percent of a line (100 single), negative: master units */
    lineSpacing?: number;
    spaceBefore?: number;
    spaceAfter?: number;
    /** where the text starts */
    leftMargin?: number;
    /** where the first line (the bullet) starts */
    indent?: number;
    defaultTab?: number;
    tabs?: {
        pos: number;
        type: number;
    }[];
    textDirection?: number;
}
/** character properties */
export interface CF {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    shadow?: boolean;
    font?: number;
    eaFont?: number;
    symbolFont?: number;
    /** points */
    size?: number;
    /** ColorIndexStruct */
    color?: number;
    /** superscript (positive) / subscript (negative) percent */
    position?: number;
    /** index of the run's extra properties in the PowerPoint 2000 StyleTextProp9Atom */
    pp9rt?: number;
}
/** PowerPoint 2000 paragraph extras (TextPFException9): automatic numbering */
export interface PF9 {
    /** numbering scheme and start, null: bullets without numbers */
    num?: {
        scheme: number;
        start: number;
    } | null;
}
export interface MasterLevel {
    pf: PF;
    cf: CF;
}
/** text types of TextHeaderAtom / TxMasterStyleAtom */
export declare const TX: {
    title: number;
    body: number;
    notes: number;
    other: number;
    centerBody: number;
    centerTitle: number;
    halfBody: number;
    quarterBody: number;
};
/** reads a TextPFException at `k`; returns it with the offset after it */
export declare function readPF(r: Rec, k: number): [PF, number];
/** reads a TextCFException at `k`; returns it with the offset after it */
export declare function readCF(r: Rec, k: number): [CF, number];
/** a TxMasterStyleAtom: the styles of indent levels 0-4 */
export declare function readMasterStyle(r: Rec): MasterLevel[];
/** StyleTextProp9Atom: per run group, the numbering of its paragraphs (character and spelling extras skipped) */
export declare function readStyle9(r: Rec): PF9[];
/** the records of a container's programmable binary tag ("___PPT9": PowerPoint 2000 extensions, "___PPT10": 2002) */
export declare function progTag(container: Rec | undefined, name: string): Rec[];
export declare const ppt9: (container: Rec | undefined) => Rec[];
/** TextRulerAtom: per-level margins and tabs */
export interface Ruler {
    defaultTab?: number;
    tabs?: {
        pos: number;
        type: number;
    }[];
    leftMargin: (number | undefined)[];
    indent: (number | undefined)[];
}
export declare function readRuler(r: Rec): Ruler;
export type FieldKind = 'slidenum' | 'date' | 'footer' | 'header';
/** a field character; dates may carry their format (DateTimeMCAtom), others use the headers and footers format */
export interface Field {
    kind: FieldKind;
    format?: number;
}
/** a text with its runs, as stored */
export interface TextBlock {
    /** TextHeaderAtom text type */
    type: number;
    text: string;
    pfRuns: {
        count: number;
        level: number;
        pf: PF;
    }[];
    cfRuns: {
        count: number;
        cf: CF;
    }[];
    /** MasterTextPropAtom levels (when there are no paragraph runs) */
    levels: {
        count: number;
        level: number;
    }[];
    ruler?: Ruler;
    /** hyperlinked ranges: [start, end) with the InteractiveInfo container */
    links: {
        start: number;
        end: number;
        info: Rec;
    }[];
    /** a field character (slide number, date, header, footer) by position */
    fields: Map<number, Field>;
    /** numbering by run group (CF pp9rt) */
    pf9?: PF9[];
}
/** Reads the text records of a ClientTextbox or of a SlideListWithText entry (several sources may be combined). */
export declare function readText(...sources: Rec[][]): TextBlock | undefined;
