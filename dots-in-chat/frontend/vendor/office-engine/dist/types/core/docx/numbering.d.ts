import type { Theme } from '../theme';
import { type XEl } from '../xml';
import type { ParaStyle, RunStyle } from './types';
export interface Level {
    start: number;
    fmt: string;
    text: string;
    ps: ParaStyle;
    rs: RunStyle;
    isLgl: boolean;
    suff: string;
    restart?: number;
}
export declare function formatNumber(n: number, fmt: string): string;
export declare class Numbering {
    private abstracts;
    private nums;
    private counters;
    /** abstract list → the one it takes its levels from (numStyleLink → styleLink) */
    private linked;
    constructor(root: XEl | undefined, theme: Theme);
    reset(): void;
    /** First list instance whose level 0 is a bullet / a number, without overrides. */
    findList(kind: 'bullet' | 'number'): string | undefined;
    ids(): {
        abstract: number;
        num: number;
    };
    level(numId: string, ilvl: number): Level | undefined;
    /** Advances the counter for (numId, ilvl) and returns the marker text. */
    next(numId: string, ilvl: number): {
        text: string;
        level: Level;
    } | undefined;
}
