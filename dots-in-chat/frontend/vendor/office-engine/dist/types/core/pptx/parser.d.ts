import type { DocComment } from '../comments';
import { PptxComments } from './comments';
import { OpcPackage } from '../opc';
import { type XEl } from '../xml';
import type { PParaSpec, PresentationMeta, SlideModel } from './types';
export declare const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
interface GenPara {
    k?: number;
    runs: ([number, number] | undefined)[];
}
/** what a part was (null: absent) before and after an edit */
export interface PartPatch {
    path: string;
    before: string | null;
    after: string | null;
}
/**
 * One undoable edit. A shape edit is the slide XML before / after (`path`); a slide list edit (add, delete, move, hide…)
 * is the patches of every part it touched, the comments it removed, and the slide to show after undo / redo.
 */
export interface UndoEntry {
    path: string;
    before: string;
    after: string;
    parts?: PartPatch[];
    gone?: DocComment[];
    focus?: [number, number];
}
/**
 * The stack without what a text edit of slide `p` (now `text`) makes stale: its shape entries go (their XML no longer
 * matches); a slide list entry that created the slide keeps its place and re-creates the slide as it is now.
 */
export declare function dropUndo(stack: UndoEntry[], p: string, text: string): UndoEntry[];
export declare class PptxPresentation {
    readonly pkg: OpcPackage;
    readonly mainPath: string;
    private defaultTextStyle;
    private masters;
    /** the comments (read in `open`) */
    comments: PptxComments;
    private layouts;
    private tableStyles?;
    readonly meta: PresentationMeta;
    private constructor();
    static open(pkg: OpcPackage, mainPath: string): Promise<PptxPresentation>;
    private part;
    private master;
    private layout;
    private getTableStyles;
    slide(index: number): Promise<SlideModel>;
    /** speaker notes: the text of the body placeholder of the slide's notes slide (paragraphs on lines) */
    private notesOf;
    get defaults(): XEl | undefined;
    private genMaps;
    /** structural edits (shapes, slides) */
    touched: boolean;
    /** shape edits (slide XML before / after) for undo; text edits drop the entries of their slide */
    undoStack: UndoEntry[];
    redoStack: UndoEntry[];
    private originals;
    private lateShapes;
    /**
     * Takes the slide XML that text edits use as template (their run references point into it).
     * Done lazily on the first text edit; collaboration takes it up front so every client uses the same.
     */
    keepOriginal(path: string): Promise<void>;
    genMap(path: string, sid: number, cell?: [number, number]): GenPara[] | undefined;
    get dirty(): boolean;
    /** Rewrites the paragraphs of shape `sid` on slide `index` and returns the re-rendered slide. */
    setText(index: number, sid: number, paras: PParaSpec[], cell?: [number, number]): Promise<SlideModel>;
    save(): Promise<Blob>;
}
export {};
