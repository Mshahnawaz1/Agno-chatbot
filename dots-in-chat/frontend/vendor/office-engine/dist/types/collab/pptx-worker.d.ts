import type { PptxPresentation } from '../core/pptx/parser';
import type { PresentationMeta, SlideModel } from '../core/pptx/types';
import type { POp } from './pptx-ops';
export interface PptxCollabResult {
    /** slide index + its new model */
    slide?: number;
    model?: SlideModel;
    /** slide list changed */
    meta?: PresentationMeta;
    /** image relationship id (image ops) */
    rid?: string;
}
export declare class PptxCollabWorker {
    private pres;
    private recs;
    private byOp;
    private seq;
    /** image key → relationship id, per slide */
    private images;
    constructor(pres: PptxPresentation);
    /** text templates of every slide, taken in the shared state (before any op / right after slide-list changes) */
    private originals;
    private ready?;
    private index;
    private get genMaps();
    private snap;
    private restore;
    private model;
    apply(op: POp): Promise<{
        res: PptxCollabResult;
        rec: number | null;
    }>;
    /** exactly undoes an applied operation (rebase) */
    revert(id: number): Promise<PptxCollabResult>;
}
