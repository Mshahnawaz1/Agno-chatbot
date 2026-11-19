import { type Chp, type Pap, type Pn, type Tables } from './props';
export interface Level {
    nfc?: number;
    jc?: number;
    follow?: number;
    start?: number;
    legal?: boolean;
    norestart?: boolean;
    /** \leveltext as read: its length, then the text with level placeholders \'00-\'08 */
    text?: string;
    ch: Chp;
    pp: Pap;
}
export interface ListDef {
    id?: number;
    levels: Level[];
}
export interface Override {
    listid?: number;
    ls?: number;
    /** start-at overrides by level */
    starts: Map<number, number>;
    /** \lfolevel groups seen */
    lfo: number;
}
export declare const pnFormat: (w: string) => string;
export declare class Numbering {
    private t;
    readonly lists: ListDef[];
    readonly overrides: Map<number, Override>;
    /** \pnseclvlN: legacy outline numbering levels */
    readonly pnSec: Pn[];
    private pnAbstract;
    private pnLevels;
    private pnNums;
    private nextPn;
    constructor(t: Tables);
    private isSymbol;
    /** a paragraph's list (\lsN) exists */
    has(ls: number): boolean;
    private levelXml;
    /** numId of a legacy `\pn` paragraph, or undefined (\pnlvlcont: no number) */
    pn(pn: Pn, prev: {
        key?: string;
        num?: number;
    }): {
        num: number;
        ilvl: number;
    } | undefined;
    private pnLevel;
    /** numbering.xml content, or undefined when the document has no lists */
    xml(): string | undefined;
}
