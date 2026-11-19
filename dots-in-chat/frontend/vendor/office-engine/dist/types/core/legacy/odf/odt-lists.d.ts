import { type ONode } from './common';
import { type RP } from './odt-props';
/** what a list level does to its paragraphs */
export interface Level {
    /** shows a label (bullet or number) */
    labeled: boolean;
    /** left indent of the text and hanging of the label (negative: first line indent), points */
    left: number;
    hanging: number;
    /** label-width-and-position mode: the indents add to the paragraph's own left margin */
    relative: boolean;
    start: number;
}
/** The numbering part being built: one abstract numbering per list style, instances (w:num) per list. */
export declare class OdtNumbering {
    private charProps;
    private abs;
    private absXml;
    private nums;
    private shared;
    /** `charProps`: the run properties of a character style (bullet and number labels) */
    constructor(charProps: (name: string | undefined) => RP);
    private abstract;
    private level;
    /** the levels of a list style */
    levels(ls: ONode): Level[];
    /** a new instance of a list style, numbered from the level starts (or `starts` for some levels) */
    restart(ls: ONode, starts?: Record<number, number>): number;
    /** the one instance of a list style whose numbers never restart (bullet lists) */
    share(ls: ONode): number;
    /** changes where an instance starts at a level (before any of its paragraphs is numbered there) */
    setStart(numId: number, level: number, start: number): void;
    /** whether a list style numbers a level (not bullets nor nothing) */
    numbered(ls: ONode, level: number): boolean;
    get empty(): boolean;
    xml(ns: string): string;
}
