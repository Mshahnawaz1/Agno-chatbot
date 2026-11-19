/**
 * Tracked changes ("suggesting"): an edit made while tracking is turned into marks. Text taken out stays, marked
 * deleted (text the author had inserted is really removed); text put in is marked inserted. Works on the result of any
 * edit (typing, Backspace / Delete, paste, replacing a selection, several paragraphs) by comparing the paragraphs
 * before and after it, so every editing path is covered without touching them.
 *
 * Not tracked: formatting, paragraph marks (Enter, joining paragraphs), pictures and other objects (removed for real;
 * one already deleted in the file stays deleted).
 */
import type { Inline, Paragraph, TrackMark } from '../../core/docx/types';
import { type Sel } from '../edit/rich';
/**
 * The edit `before` → `next` (paragraphs at `pa0`, the caret `sel` after it, `selBefore` before it) made by the author
 * of `mark`, as tracked changes.
 */
export declare function trackEdit(before: Paragraph[], next: Paragraph[], pa0: string, sel: Sel, selBefore: Sel | null, mark: TrackMark): {
    next: Paragraph[];
    sel: Sel;
};
/** runs [a, b) with their changes accepted (inserted text stays, deleted text goes) or rejected (the other way round) */
export declare function resolveRuns(runs: Inline[], a: number, b: number, accept: boolean): Inline[];
export declare const hasChanges: (p: Paragraph) => boolean;
/** [start, end) of each run of tracked change in a paragraph */
export declare function changeSpans(p: Paragraph): {
    a: number;
    b: number;
    tc: TrackMark;
}[];
