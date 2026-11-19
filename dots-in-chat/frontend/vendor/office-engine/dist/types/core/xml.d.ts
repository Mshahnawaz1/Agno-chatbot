export type Attrs = Record<string, string>;
export interface SaxHandler {
    /** Return `true` to skip the element's whole subtree (no `close` is emitted then). */
    open(name: string, attrs: Attrs, selfClosing: boolean): boolean | void;
    close(name: string): void;
    text(text: string): void;
}
export declare function decodeEntities(s: string): string;
/**
 * Elements inside one another, at most: far more than a document nests (tables in tables in text boxes stay under a
 * hundred), and few enough for the code that walks a tree by calling itself. A file nested deeper is refused with an
 * error, instead of running out of stack somewhere later.
 */
export declare const MAX_XML_DEPTH = 1024;
export declare const tooDeep: () => Error;
export declare class SaxParser {
    private h;
    private raw?;
    /** what of the last chunk waits for the next one: the start of a token, a few characters at most */
    private buf;
    private depth;
    private skipDepth;
    private relPrefixes;
    /**
     * Inside a comment, a processing instruction, a declaration or a CDATA section that ends in a later chunk: what
     * ends it. Its content is passed on (or dropped) chunk by chunk, never held: a comment of 300 MB costs nothing.
     */
    private until;
    private cdata;
    /**
     * A tag that ends in a later chunk: its pieces so far, joined when the end comes (so it is read once, however many
     * chunks it spans), their length, and the quote its end is looked for inside.
     */
    private tag;
    private tagLen;
    private tagQuote;
    private tagQuoted;
    /**
     * @param raw optional tap receiving every consumed source segment verbatim (tags, text, comments…),
     *   called right before the matching handler event. Used for byte-preserving rewrites. A long text or comment
     *   comes in several segments.
     */
    constructor(h: SaxHandler, raw?: ((segment: string) => void) | undefined);
    write(chunk: string): void;
    end(): void;
    /** index of the `>` that ends the unfinished tag in `chunk`, -1 when it is not there (the quote state moves on) */
    private tagEnd;
    /** the tag starting at `lt` does not end in `s`: it is held until it does */
    private holdTag;
    /**
     * The comment / processing instruction / declaration / CDATA section opened at `lt` (its opening `open` characters
     * long) does not end in `s`: what is there of it is passed on, less the characters its end may start with.
     */
    private enter;
    private run;
    private onText;
    private onOpen;
    private onClose;
}
export declare class AbortedError extends Error {
    constructor();
}
export interface StreamParseOptions {
    signal?: AbortSignal;
    /** verbatim source tap, see SaxParser */
    raw?: (segment: string) => void;
    /** Called after each chunk (decompressed byte count); may return a promise to yield. */
    onChunk?: (bytes: number) => void | Promise<void>;
}
/**
 * How a part is encoded: the byte order mark, else the first bytes of "<?" as UTF-16 (XML 1.0 appendix F), else a
 * single-byte encoding the declaration names, else UTF-8. The common case costs two comparisons.
 */
export declare function xmlEncoding(b: Uint8Array): string;
/** the text of a part: any encoding XML allows (the byte order mark is dropped) */
export declare function decodeXml(b: Uint8Array): string;
/** a part written out as UTF-8 must not declare another encoding */
export declare function utf8Declaration(xml: string): string;
export declare function parseXmlStream(stream: ReadableStream<Uint8Array>, h: SaxHandler, opts?: StreamParseOptions): Promise<void>;
export interface XEl {
    n: string;
    a: Attrs;
    c: XEl[];
    t: string;
}
export interface TreeBuilderOptions {
    /** When set, elements at this depth are built and emitted one by one; ancestors are not kept. */
    emitDepth?: number;
    onElement?: (el: XEl) => void;
    onShallowOpen?: (name: string, attrs: Attrs, depth: number) => void;
    /** Element local names whose subtree is dropped. */
    skip?: Set<string>;
    /**
     * Namespace prefixes a reader understands: an mc:Choice is taken only when everything it `Requires` is in the set,
     * else the mc:Fallback is (content the reader cannot model stays out of the tree, and its source with it).
     * Unset: the first mc:Choice always wins.
     */
    understood?: ReadonlySet<string>;
}
/** What a docx reader models of the markup Word 365 hides in mc:Choice: drawings, shapes, groups, newer drawing / run extensions. */
export declare const DOCX_UNDERSTOOD: ReadonlySet<string>;
/** whether every namespace an mc:Choice `Requires` (space separated prefixes) is understood */
export declare function choiceUnderstood(requires: string | undefined, understood: ReadonlySet<string>): boolean;
/** Builds XEl trees; resolves mc:AlternateContent by taking the first mc:Choice (see `understood`). */
export declare class TreeBuilder implements SaxHandler {
    private o;
    root: XEl | null;
    private stack;
    private parents;
    private depth;
    private alt;
    constructor(o?: TreeBuilderOptions);
    open(name: string, a: Attrs): boolean | void;
    close(name: string): void;
    text(t: string): void;
}
export declare function parseXml(xml: string, skip?: Set<string>, understood?: ReadonlySet<string>): XEl;
export declare function kid(el: XEl | undefined, name: string): XEl | undefined;
export declare function kids(el: XEl | undefined, name: string): XEl[];
export declare function path(el: XEl | undefined, ...names: string[]): XEl | undefined;
export declare function desc(el: XEl | undefined, name: string): XEl | undefined;
export declare function descAll(el: XEl | undefined, name: string, out?: XEl[]): XEl[];
export declare function num(v: string | undefined, def?: number): number | undefined;
/** OOXML on/off value: absent element → undefined, `<x/>` → true. */
export declare function onOff(el: XEl | undefined, attr?: string): boolean | undefined;
export declare function textOf(el: XEl | undefined): string;
