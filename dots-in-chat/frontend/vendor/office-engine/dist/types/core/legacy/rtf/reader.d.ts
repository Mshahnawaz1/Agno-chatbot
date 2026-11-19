/**
 * The RTF interpreter: a stack of group states (destination, character and paragraph properties, `\uc`), control
 * words applied to it, and text flowing into stories (body, headers / footers, notes, text boxes) as WordprocessingML.
 */
import { Part } from '../../iwork/ooxml';
import { Lexer } from './lexer';
import { Numbering, type Level, type ListDef, type Override } from './lists';
import { Story, type DocSetup, type Field, type Sect, type Shape, type State } from './model';
import { Media, type Pict } from './pictures';
import { type Border, type Chp, type Font, type Pap, type Pn, type Side, type Tables } from './props';
import { RtfStyles, type StyleDef } from './styles';
import { type CellDef, type RowDef } from './tables';
import { TextAcc } from './text';
/** the family of a PostScript font name (Cocoa writes those): "Times-Bold" → "Times", "TimesNewRomanPSMT" → "Times New Roman" */
export declare function psFamily(name: string): string;
export declare class RtfReader {
    readonly lx: Lexer;
    readonly stack: State[];
    st: State;
    readonly tables: Tables;
    readonly styles: RtfStyles;
    readonly num: Numbering;
    readonly media: Media;
    ansi: number;
    readonly docPart: Part;
    readonly notePart: Part;
    readonly endPart: Part;
    readonly body: Story;
    readonly footnotes: string[];
    readonly endnotes: string[];
    /** headers / footers referenced from sections */
    readonly hfFiles: Map<string, {
        part: Part;
        xml: string;
    }>;
    hfCount: {
        header: number;
        footer: number;
    };
    doc: DocSetup;
    sect: Sect;
    /** sectPr of the last section (the body's) */
    finalSect: string;
    private done;
    private buf;
    private runRPr;
    private runLink?;
    private runStory?;
    /** the tracked change the run belongs to (w:ins / w:del attributes) */
    private runRev;
    /** the font of the run being read, by name (symbol fonts' text is mapped to Unicode) */
    private runFont;
    /** authors of tracked changes (\revtbl) */
    revAuthors: string[];
    /** w:id of bookmarks and tracked changes */
    annId: number;
    dirty: boolean;
    lastCh?: Chp;
    private lastS?;
    private lastRPr;
    private ucSkip;
    private starred;
    /** nothing but \* read since the last { */
    private fresh;
    private cpCache;
    /** run / paragraph properties by what they are made of */
    private rPrCache;
    private pPrCache;
    rowDefs: RowDef[];
    cell: CellDef;
    /** what border words apply to: a paragraph side, a row side, a cell side */
    brdr?: {
        kind: 'p' | 'r' | 'c';
        sides: Side[];
    };
    tabKind?: string;
    tabLeader?: string;
    font?: {
        idx: number;
        f: Font;
        acc: TextAcc;
    };
    color: {
        r: number;
        g: number;
        b: number;
        set: boolean;
    };
    list?: ListDef;
    level?: Level;
    ovr?: Override;
    lfo: number;
    pn?: Pn;
    style?: StyleDef;
    fields: Field[];
    /** bookmarks: name → w:id, and those started but not ended */
    readonly marks: Map<string, number>;
    readonly openMarks: Set<number>;
    /** run properties of the last \chftn of the body (the mark of the note that follows) */
    ftnRPr?: string;
    pict?: Pict;
    shapes: Shape[];
    sn?: string;
    sv?: string;
    /** the last \shppict gave a picture: its \nonshppict is skipped */
    shppict: 'none' | 'ok' | 'fail';
    /** written by Apple's Cocoa text system (\cocoartf) */
    cocoa: boolean;
    /** Cocoa attachment character after a \NeXTGraphic group */
    dropAttachment: boolean;
    constructor(bytes: Uint8Array);
    /** forgets computed properties (the style, font or color tables changed) */
    invalidate(): void;
    setAnsi(cp: number): void;
    /** the character properties of the group, to change */
    chp(): Chp;
    pap(): Pap;
    /** the row definition words apply to */
    get row(): RowDef;
    newRowDef(): void;
    /** skips the rest of the current group */
    skip(): void;
    private open;
    private close;
    /** `{\*\ud` follows (the Unicode half of a \upr group) */
    private peekUd;
    run(): void;
    private word;
    private symbol;
    /** the code page of text in the current font */
    cp(): number;
    private text;
    /** a byte from \'hh */
    private byte;
    /** characters (\u, \tab, \emdash…) */
    char(c: string): void;
    /** \uN, then skip its fallback characters */
    unicode(n: number): void;
    fontCommit(): void;
    colorCommit(): void;
    private beginStyle;
    /** run properties of text in state `s` */
    rPrOf(s: State): string;
    /** 'i' / 'd' and the w:author / w:date attributes of a tracked change; '' for none */
    private revOf;
    /** the run being read takes the current formatting (a new run starts when it differs) */
    private sync;
    flushRun(): void;
    /** inline content (a break, a field, a picture) at the current position */
    item(xml: string): void;
    depthOf(pp: Pap): number;
    private container;
    /** closes the tables nested deeper than `depth` */
    closeTables(story: Story, depth: number): void;
    private content;
    /** ends the paragraph of `story` with properties `pp` / mark `ch`, in table depth `depth` (default: its own) */
    endPara(story: Story, pp: Pap, ch: Chp, depth?: number, sectPr?: string): void;
    par(): void;
    /** \cell / \nestcell */
    cellEnd(nested: boolean): void;
    /** \row / \nestrow */
    rowEnd(nested: boolean): void;
    /** the end of a story: its last paragraph and tables; the XML of its blocks */
    finishStory(story: Story, s: State): string;
    private finishBody;
    sectBreak(): void;
    private sectPr;
    /** border words: the paragraph / row / cell side they apply to */
    border(): Border | undefined;
    /** applies a border property to every side the border words address */
    setBorder(f: (b: Border) => void): void;
    /** marks the end of the reader's own state (after the main loop) */
    finish(): void;
}
