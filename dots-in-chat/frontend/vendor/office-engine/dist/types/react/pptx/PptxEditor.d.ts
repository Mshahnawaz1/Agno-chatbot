import type { PRunSet, SlideModel, TextBody, TPara, TRun } from '../../core/pptx/types';
import type { DocumentClient } from '../../core/worker/client';
import { RichInput, type ReplaceOpts, type RichHost } from '../edit/input';
import { type RRun, type Sel } from '../edit/rich';
type RunStyle = Omit<TRun, 'text' | 'br' | 'fld' | 'src' | 'href'>;
export interface EPara {
    runs: RRun[];
    base: TPara;
    algn: TPara['algn'];
    algnSet?: boolean;
    /** paragraph changes made here (written back) */
    pp?: {
        lvl?: number;
        bullet?: 'none' | 'bullet' | 'number';
        lnPct?: number;
    };
    k?: number;
    caret?: RRun;
}
export interface PptxFormat {
    b: boolean;
    i: boolean;
    u: boolean;
    strike: boolean;
    sz?: number;
    color?: string;
    font?: string;
    algn?: string;
    hl?: string;
    baseline?: number;
    bullet?: 'none' | 'bullet' | 'number';
    lvl: number;
    lnPct?: number;
}
export declare function toTPara(p: EPara, num?: number): TPara;
export declare class PptxEditor implements RichHost<EPara> {
    private client;
    readonly input: RichInput;
    paras: EPara[];
    body?: TextBody;
    slide: number;
    sid: number;
    /** [row, column] when the text is a table cell's (`sid` is then the table's id) */
    cell?: [number, number];
    pendingSel: Sel | null;
    private history;
    private future;
    private pend;
    private timer;
    private changedSinceCommit;
    private commits;
    private committing?;
    onChange?: () => void;
    onCommitted?: (slide: number, model: SlideModel) => void;
    onDirty?: () => void;
    onState?: (s: PptxFormat | null) => void;
    /** Tab / Shift+Tab in a table cell: go to the next / previous cell */
    onCellMove?: (d: 1 | -1) => void;
    constructor(client: DocumentClient);
    get active(): boolean;
    begin(slide: number, sid: number, body: TextBody, cell?: [number, number]): void;
    end(): void;
    text(): TextBody | undefined;
    para(pa: string): EPara;
    span(a: string, b: string): string[];
    prev(pa: string): string | undefined;
    next(pa: string): string | undefined;
    cmp(a: string, b: string): number;
    withRuns(p: EPara, runs: RRun[]): EPara;
    split(p: EPara, left: RRun[], right: RRun[]): [EPara, EPara];
    join(a: EPara, _b: EPara, runs: RRun[]): EPara;
    defaultRun(p: EPara): Partial<RRun> | undefined;
    pendingStyle(): Partial<RRun> | undefined;
    clearPending(): void;
    replace(pas: string[], next: EPara[], sel: Sel, opts?: ReplaceOpts & {
        history?: boolean;
    }): void;
    undo(): void;
    redo(): void;
    private restore;
    private commitInBackground;
    /** Flush the debounce and any edits made while an earlier commit was in flight. */
    flush(): Promise<void>;
    commit(): Promise<void>;
    private drainCommits;
    format(s: Partial<RunStyle>, d: PRunSet): void;
    toggle(key: 'b' | 'i' | 'u' | 'strike'): void;
    setSize(sz: number): void;
    setColor(c: string | null): void;
    setFont(name: string): void;
    setAlign(algn: TPara['algn']): void;
    /** applies a paragraph-level change to the selected paragraphs */
    private paraOp;
    toggleBullet(kind: 'bullet' | 'number'): void;
    indentLevel(d: 1 | -1): void;
    /**
     * Tab / Shift+Tab: the level of a list item (the keys of the Increase / Decrease indent buttons), the next / previous
     * cell in a table. Anywhere else Tab types a tab and Shift+Tab does nothing.
     */
    tab(sel: Sel, shift: boolean): boolean;
    setLineSpacing(x: number): void;
    setHighlight(c: string | null): void;
    toggleBaseline(kind: 'sup' | 'sub'): void;
    clearFormat(): void;
    state(sel?: Sel | null): PptxFormat | null;
    onSelection(sel: Sel | null): void;
    shortcut?: (e: KeyboardEvent) => boolean;
}
export {};
