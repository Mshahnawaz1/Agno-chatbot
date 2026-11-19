/**
 * Pure run-level text operations shared by the DOCX and PPTX editors.
 * A run is either text ({ t: 'text', text }) or an atomic object counting as one character.
 */
export interface RRun {
    t: string;
    text?: string;
    s?: object;
    d?: object;
    src?: unknown;
    href?: string;
    lk?: string;
    /** comment threads covering the run (DOCX) */
    cm?: string[];
    /** tracked change the run belongs to (DOCX) */
    tc?: object;
    /** source run properties beyond the style (DOCX): runs that differ in it stay apart */
    rp?: string;
}
export interface Pos {
    /** paragraph address (container path; last segment = index in container) */
    pa: string;
    o: number;
}
export interface Sel {
    a: Pos;
    f: Pos;
}
export declare const rlen: (r: RRun) => number;
export declare const plen: (runs: RRun[]) => number;
export declare const collapsed: (s: Sel) => boolean;
export declare const shiftPa: (pa: string, d: number) => string;
export declare function runsText(runs: RRun[]): string;
export declare const sameMarks: (a: string[] | undefined, b: string[] | undefined) => boolean;
/**
 * Comment threads text inserted at `o` joins: those covering both the character before and the one after (typing at
 * the edge of a commented range does not extend it).
 */
export declare function marksAt(runs: RRun[], o: number): string[] | undefined;
/** `run` covered by exactly the comment threads `cm` */
export declare function withMarks<R extends RRun>(run: R, cm: string[] | undefined): R;
/** Merges adjacent identical text runs and drops empty ones. */
export declare function normalize<R extends RRun>(runs: R[]): R[];
/** Splits runs at offset o (text runs are cut). */
export declare function splitRuns<R extends RRun>(runs: R[], o: number): [R[], R[]];
export declare function sliceRuns<R extends RRun>(runs: R[], a: number, b: number): R[];
/** Text run whose style applies at offset o (left affinity). */
export declare function runAt<R extends RRun>(runs: R[], o: number): R | undefined;
/**
 * [start, end) of the link a caret at `o` is in: the text run it follows (or the first one at 0) and the runs around it
 * with the same target; null when that run is no link.
 */
export declare function linkSpan(runs: RRun[], o: number): [number, number] | null;
export declare function insertText<R extends RRun>(runs: R[], o: number, text: string, style?: Partial<R>, fallback?: Partial<R>): R[];
export declare function deleteRange<R extends RRun>(runs: R[], a: number, b: number): R[];
/** runs [a, b) join (`on`) or leave comment thread `id` */
export declare function markRange<R extends RRun>(runs: R[], a: number, b: number, id: string, on: boolean): R[];
export declare function formatRange<R extends RRun>(runs: R[], a: number, b: number, s: object, d: object): R[];
/** Previous grapheme boundary (surrogate pairs + combining marks). */
export declare function prevBoundary(text: string, o: number): number;
export declare function nextBoundary(text: string, o: number): number;
