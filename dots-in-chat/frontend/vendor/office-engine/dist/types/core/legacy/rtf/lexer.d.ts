/** RTF tokenizer: groups, control words / symbols, text, `\'hh` bytes and `\bin` data, read from the file's bytes. */
export declare const END = 0;
export declare const OPEN = 1;
export declare const CLOSE = 2;
export declare const WORD = 3;
export declare const SYMBOL = 4;
export declare const TEXT = 5;
export declare const HEX = 6;
export declare const BIN = 7;
declare const HEXV: Int8Array<ArrayBuffer>;
export { HEXV };
export declare class Lexer {
    readonly b: Uint8Array;
    pos: number;
    /** WORD / SYMBOL: the name ('par', '~', '*', '\n'…) */
    word: string;
    /** WORD: the numeric parameter (0 when none); HEX: the byte */
    param: number;
    hasParam: boolean;
    /** TEXT: bytes [start, end) of the file; BIN: the data */
    start: number;
    end: number;
    constructor(b: Uint8Array);
    next(): number;
    /** Skips the rest of the current group, its closing brace included (binary data and escaped braces are stepped over). */
    skipGroup(): void;
}
/** Collects hexadecimal picture data (whitespace between digits ignored). */
export declare class HexSink {
    buf: Uint8Array;
    len: number;
    private half;
    constructor(size?: number);
    private room;
    hex(src: Uint8Array, s: number, e: number): void;
    raw(src: Uint8Array, s: number, e: number): void;
    bytes(): Uint8Array;
}
