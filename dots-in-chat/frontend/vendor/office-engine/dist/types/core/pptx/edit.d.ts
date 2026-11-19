import type { PptxPresentation } from './parser';
import type { PresentationMeta, ShapeOp, SlideModel, SlideOp } from './types';
/** undoes / redoes the last edit (a shape edit, or a change of the slide list); returns the slide shown and its model */
export declare function undoShapes(pres: PptxPresentation, redo?: boolean): Promise<{
    index: number;
    model: SlideModel;
    meta?: PresentationMeta;
} | null>;
export declare function addSlideImage(pres: PptxPresentation, index: number, bytes: Uint8Array, ext: string): Promise<string>;
export declare function shapeOps(pres: PptxPresentation, index: number, ops: ShapeOp[]): Promise<SlideModel>;
/**
 * A slide list edit, undoable: what it touched (the presentation, its relationships and content types, the slide's
 * part and the parts that go with it) is kept as before / after text, with the comments it removed.
 */
export declare function slideOp(pres: PptxPresentation, op: SlideOp): Promise<PresentationMeta>;
