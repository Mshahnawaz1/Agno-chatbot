import type { CellInput, FindOptions, FmtPatch, Range, SheetOp } from '../core/xlsx/types';
import type { CommentOp } from './comments';
/** sheets are addressed by part path: indexes move when sheets are added / reordered */
export type PBookOp = {
    op: 'add';
    name?: string;
    after?: string;
}
/** `was`: the name it had where the rename was made (formulas typed meanwhile elsewhere still say it) */
 | {
    op: 'rename';
    path: string;
    name: string;
    was?: string;
} | {
    op: 'delete';
    path: string;
} | {
    op: 'move';
    path: string;
    to: number;
} | {
    op: 'duplicate';
    path: string;
};
export type XOp = {
    t: 'set';
    id: string;
    sheet: string;
    cells: CellInput[];
} | {
    t: 'fmt';
    id: string;
    sheet: string;
    range: Range;
    patch: FmtPatch;
}
/** `name`: the sheet's name where the operation was made, for rows / columns inserted or deleted (formulas typed meanwhile elsewhere read it by that name) */
 | {
    t: 'sheet';
    id: string;
    sheet: string;
    op: SheetOp;
    name?: string;
} | {
    t: 'replace';
    id: string;
    sheet: string;
    query: string;
    by: string;
    opts?: FindOptions;
    at?: {
        r: number;
        c: number;
    };
} | {
    t: 'book';
    id: string;
    op: PBookOp;
}
/** sets the cells changed by op `target` back to their state before (`prev`) or after (`next`) it */
 | {
    t: 'revert';
    id: string;
    target: string;
    which: 'prev' | 'next';
}
/** a comment set / deleted; a thread's cell moves with inserted / deleted rows and columns */
 | (CommentOp & {
    id: string;
});
export declare const STRUCTURAL: Set<"clear" | "colWidth" | "deleteCols" | "deleteRows" | "fill" | "freeze" | "gridlines" | "hideCols" | "hideRows" | "insertCols" | "insertRows" | "merge" | "paste" | "rowHeight" | "sort" | "unmerge">;
export declare const isStructural: (o: XOp) => boolean;
/** index after `n` items were inserted (n > 0) or deleted (n < 0) at `at`; null when deleted */
export declare function shiftIdx(x: number, at: number, n: number): number | null;
/** inclusive span [a, b] after an insert / delete; null when entirely deleted */
export declare function shiftSpan(a: number, b: number, at: number, n: number): [number, number] | null;
/** `op` adjusted to apply after `prior` (deterministic) */
export declare function transformX(op: XOp, prior: XOp): XOp | null;
export declare function footprint(op: XOp): {
    sheet: string;
    range: Range;
} | null;
/** whether remote ops interact with pending local ones (→ rebase) */
export declare function conflictsX(pending: XOp[], remote: XOp[]): boolean;
