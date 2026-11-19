import type { PptDocument } from './document';
import { Rec } from './records';
import { type CF, type PF, type TextBlock } from './text';
/** master units (576 per inch) → EMU */
export declare const emu: (mu: number) => number;
/** The text styles in effect for a main master: document defaults and the master's TxMasterStyleAtoms. */
export declare class TextStyles {
    private levels;
    private docPF;
    private docCF;
    constructor(doc: PptDocument, master: Rec | undefined);
    /** master style records from least to most specific for a text type and level */
    private chain;
    pf(type: number, level: number): PF;
    cf(type: number, level: number): CF;
    has(type: number): boolean;
}
export interface TextEnv {
    doc: PptDocument;
    styles: TextStyles;
    /** the color scheme in effect */
    scheme: string[];
    /** hlinkClick for an InteractiveInfo container ('' when none) */
    link: (info: Rec) => string;
    /** the slide number (undefined on masters and layouts: a slide number field) */
    slideNumber?: number;
    /** values of the date, footer and header fields; the headers and footers date format */
    values?: {
        date?: string;
        footer?: string;
        header?: string;
        dateFormat?: number;
    };
}
/** ColorIndexStruct → RRGGBB */
export declare function colorIndex(v: number | undefined, scheme: string[]): string | undefined;
/** a bullet character in its font → [character, font to write] */
export declare function bulletChar(code: number | undefined, font: string | undefined): [string, string | undefined];
/** run properties (`tag`: rPr, endParaRPr or defRPr); `link` an hlinkClick element */
export declare function rPrXml(cf: CF, env: TextEnv, tag: string, link?: string): string;
/** the a:lvlNpPr of a master text style level */
export declare function lvlXml(n: number, pf: PF, cf: CF, env: TextEnv): string;
/** the a:p elements of a text */
export declare function paragraphsXml(block: TextBlock, env: TextEnv): string;
/** a date in one of PowerPoint's 13 date / time formats (US English) */
export declare function dateText(format?: number, d?: Date): string;
