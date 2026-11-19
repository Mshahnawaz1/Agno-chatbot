import { type DocSource } from '../source';
import type { Events, Methods, OpenParams, OpenResult } from './protocol';
type Emit = <K extends keyof Events>(event: K, data: Events[K]) => void;
/** Format-agnostic engine; runs inside the worker (or directly, e.g. in tests). */
export declare class Engine {
    private emit;
    private pkg?;
    private kind?;
    private docx?;
    private xlsx?;
    private xlsxEd?;
    private pptx?;
    private abort;
    private plainText;
    constructor(emit: Emit);
    open(src: DocSource, params?: OpenParams): Promise<OpenResult>;
    private writes;
    call<M extends keyof Methods>(method: M, args: unknown[]): Promise<unknown>;
    private dispatch;
    /** the comments of the open document */
    private comments;
    private xcollab?;
    private pcollab?;
    private xc;
    private xed;
    private save;
    dispose(): void;
    private need;
}
export {};
