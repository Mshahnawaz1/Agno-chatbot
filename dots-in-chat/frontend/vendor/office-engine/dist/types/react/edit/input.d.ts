/**
 * Controlled contentEditable: the DOM is only a view. Every mutation is taken from
 * `beforeinput` (cancelled) and applied to the model through a RichHost; IME
 * composition (Vietnamese Telex/VNI, CJK…) is committed on `compositionend`.
 */
import { type Pos, type RRun, type Sel } from './rich';
export interface RichPara {
    runs: RRun[];
}
export interface ReplaceOpts {
    label?: string;
    /** rebuild paragraph DOM (after IME composition mutated it) */
    remount?: boolean;
}
export interface RichHost<P extends RichPara = RichPara> {
    para(pa: string): P | undefined;
    /** inclusive list of paragraph addresses from a to b in one container, or null */
    span(a: string, b: string): string[] | null;
    prev(pa: string): string | undefined;
    next(pa: string): string | undefined;
    cmp(a: string, b: string): number;
    /** replace contiguous paragraphs; `sel` is the selection afterwards */
    replace(pas: string[], next: P[], sel: Sel, opts?: ReplaceOpts): void;
    withRuns(p: P, runs: RRun[]): P;
    split(p: P, left: RRun[], right: RRun[], atEnd: boolean): [P, P];
    join(a: P, b: P, runs: RRun[]): P;
    /** Backspace at offset 0 (e.g. leave a list); true when handled */
    backspaceAtStart?(pa: string, p: P): boolean;
    /** Tab inside a paragraph (e.g. indent list); true when handled */
    tab?(sel: Sel, shift: boolean): boolean;
    /** Enter in an empty paragraph (e.g. leave a list); true when handled */
    enterAtEmpty?(pa: string, p: P): boolean;
    /** ArrowRight / ArrowLeft with a caret that may have to leave a container (a table); true when handled */
    arrow?(sel: Sel, dir: 1 | -1): boolean;
    /** copy / cut: puts the selection on the clipboard from the model; true when handled (the browser's own copy is skipped) */
    copy?(sel: Sel, data: DataTransfer, cut: boolean): boolean;
    undo(): void;
    redo(): void;
    toggle?(key: 'b' | 'i' | 'u'): void;
    shortcut?(e: KeyboardEvent): boolean;
    /** style for text typed into an empty paragraph */
    defaultRun?(p: P): Partial<RRun> | undefined;
    /** paste with formatting / files; true when handled */
    pasteRich?(sel: Sel, data: DataTransfer): boolean;
    /** caret style for the next typed text (set after formatting a collapsed selection) */
    pendingStyle?(): Partial<RRun> | undefined;
    clearPending?(): void;
    onSelection?(sel: Sel | null): void;
    /** the whole document (select all); null when there is nothing to select */
    all?(): Sel | null;
    /** deletes a range that spans other blocks (tables): applies the change and returns the caret, or null when unsupported */
    deleteAcross?(s: Pos, e: Pos): Pos | null;
}
export declare function ordered(host: RichHost, s: Sel): [Pos, Pos];
export declare function opDelete(host: RichHost, sel: Sel, opts?: ReplaceOpts): void;
/**
 * Inserts runs at the selection; `lines[i]` (i > 0) start new paragraphs.
 * `props[i]` can adjust the paragraph created for line i (e.g. heading style from pasted HTML).
 */
export declare function opInsertRuns(host: RichHost, sel: Sel, lines: RRun[][], opts?: ReplaceOpts, props?: ((p: RichPara) => RichPara)[]): void;
export declare function opInsert(host: RichHost, sel: Sel, text: string, opts?: ReplaceOpts): void;
export declare function opEnter(host: RichHost, sel: Sel): void;
export declare function opBackspace(host: RichHost, sel: Sel, word?: boolean): void;
export declare function opDeleteForward(host: RichHost, sel: Sel, word?: boolean): void;
export declare function posFromDom(root: HTMLElement, node: Node, offset: number): Pos | null;
export declare function domFromPos(root: HTMLElement, pos: Pos): [Node, number] | null;
/** Selection object that can see into the shadow root containing `node` (web component embeds). */
export declare function getSel(node: Node): Selection | null;
interface SelPoints {
    anchorNode: Node | null;
    anchorOffset: number;
    focusNode: Node | null;
    focusOffset: number;
}
/** both ends of the selection, as nodes inside the shadow root containing `root` when there is one */
export declare function selPoints(root: HTMLElement): SelPoints | null;
export declare class RichInput {
    private host;
    root: HTMLElement | null;
    private composing;
    private justComposed;
    private raf;
    private last;
    /** the last selection known; assigning it makes it the selection (what an edit asked for no longer holds) */
    get lastSel(): Sel | null;
    set lastSel(sel: Sel | null);
    /** select all: the model selection covers every paragraph, the DOM one only what is rendered */
    private override;
    /**
     * The caret an edit asked for, until the DOM shows it: the next key press can come before the view is rebuilt, and
     * the DOM caret is then still where the edit was made (typing without a pause across a paragraph break).
     */
    private expected;
    /** where the DOM selection last was in a paragraph: a view update that removes this node leaves the caret on the page element */
    private seen;
    constructor(host: RichHost);
    attach(root: HTMLElement): void;
    detach(): void;
    get isComposing(): boolean;
    readSel(): Sel | null;
    /** the caret an edit asked for, which key presses go by until the view shows it (see `expected`) */
    expect(sel: Sel): void;
    /** where the caret is going to be: the one an edit asked for, else the last known */
    get caret(): Sel | null;
    /** the selection a key press acts on */
    private live;
    /**
     * After the view was rebuilt: a caret whose paragraph was removed from the DOM (it moved to another page) sits on the
     * page element, outside every paragraph. Puts it back at the last known place.
     */
    repair(): boolean;
    /** current selection, falling back to the last known one (e.g. after focusing a toolbar control) */
    sel(): Sel | null;
    /**
     * Selects the whole document. The browser's own select-all is useless here: the editing host holds
     * non-editable parts (headers, read-only paragraphs) and Chromium empties a selection that crosses them;
     * pages are also virtualized, so the DOM only ever holds a part of the document.
     */
    selectAll(): boolean;
    /** Applies a model selection to the DOM; false when its paragraph isn't rendered. */
    restore(sel: Sel | null, focus?: boolean): boolean;
    private rangeSel;
    private onBeforeInput;
    private onCompStart;
    private onCompEnd;
    private onKeyDown;
    /** a click moves the caret: what an edit asked for no longer holds */
    private onMouseDown;
    private onCopy;
    private onSelChange;
}
export {};
