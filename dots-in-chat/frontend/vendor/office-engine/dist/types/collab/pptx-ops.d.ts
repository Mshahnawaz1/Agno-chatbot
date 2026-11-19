/** PPTX collaboration operations. Slides are addressed by part path (indexes move), shapes by element id. */
import type { PParaSpec, ShapeOp } from '../core/pptx/types';
export type PSlideOp = {
    op: 'add';
    after: string | null;
    layout?: 'title' | 'content' | 'blank';
} | {
    op: 'duplicate';
    path: string;
} | {
    op: 'delete';
    path: string;
} | {
    op: 'move';
    path: string;
    to: number;
} | {
    op: 'hide';
    path: string;
    hidden: boolean;
};
import type { CommentOp } from './comments';
export type POp = 
/** a comment set / deleted */
(CommentOp & {
    id: string;
})
/** whole text of shape `sid`, or of its table cell `cell` (last writer wins per shape) */
 | {
    t: 'text';
    id: string;
    slide: string;
    sid: number;
    cell?: [number, number];
    paras: PParaSpec[];
}
/** shape edits; an inserted picture refers to its image by `key` */
 | {
    t: 'shapes';
    id: string;
    slide: string;
    ops: (ShapeOp & {
        key?: string;
    })[];
} | {
    t: 'image';
    id: string;
    key: string;
    slide: string;
    bytes: Uint8Array;
    ext: string;
} | {
    t: 'slides';
    id: string;
    op: PSlideOp;
}
/** puts the slide touched by op `target` back to its state before (`prev`) / after (`next`) it */
 | {
    t: 'revert';
    id: string;
    target: string;
    which: 'prev' | 'next';
};
export declare function transformP(op: POp, prior: POp): POp | null;
/** whether remote ops interact with pending local ones (→ rebase) */
export declare function conflictsP(pending: POp[], remote: POp[]): boolean;
