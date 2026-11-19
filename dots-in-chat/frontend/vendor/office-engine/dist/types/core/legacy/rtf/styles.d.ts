import { type Chp, type Pap, type Tables } from './props';
export interface StyleDef {
    num: number;
    /** p: paragraph, c: character, t: table, d: section */
    kind: 'p' | 'c' | 't' | 'd';
    name: string;
    basedOn?: number;
    next?: number;
    link?: number;
    qformat?: boolean;
    semiHidden?: boolean;
    unhide?: boolean;
    hidden?: boolean;
    priority?: number;
    ch: Chp;
    pp: Pap;
}
export declare class RtfStyles {
    private t;
    readonly para: Map<number, StyleDef>;
    readonly char: Map<number, StyleDef>;
    private ids;
    private used;
    private paraCache;
    private runCache;
    /** styles added for content the stylesheet does not cover (footnotes) */
    private extra;
    defChp: Chp;
    defPap: Pap;
    constructor(t: Tables);
    /** the document defaults (\deff, \defchp, \defpap) */
    setDefaults(ch: Chp, pp: Pap): void;
    add(d: StyleDef): void;
    /** gives every style its id (once the stylesheet is read); paragraphs without \s are style 0, Word's Normal */
    finish(): void;
    private assign;
    /** w:styleId of paragraph style `num` (undefined: the default style) */
    paraId(num: number | undefined): string | undefined;
    charId(num: number | undefined): string | undefined;
    /** a style chain, the root first */
    private chain;
    /**
     * what paragraph style `num` gives (complete): Word and LibreOffice write each paragraph style in full, so what its
     * entry leaves out is the RTF default, not its parent's value
     */
    paraBase(num: number | undefined): {
        ch: Chp;
        pp: Pap;
    };
    /** what text in paragraph style `para` and character style `cs` gets from them (complete) */
    runBase(para: number | undefined, cs: number | undefined): Chp;
    /** a style the document needs that the stylesheet may lack */
    ensure(id: string, xml: string): void;
    has(id: string): boolean;
    /** the w:style elements */
    xml(): string;
}
