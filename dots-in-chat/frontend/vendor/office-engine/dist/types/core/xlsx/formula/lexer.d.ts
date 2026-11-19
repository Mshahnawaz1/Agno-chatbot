/** Tokenizer for OOXML formula text (no leading '='). Tokens carry source spans so transforms can splice text. */
import { type RefAddr } from './refs';
import { type ErrorCode } from './types';
export declare class FormulaSyntaxError extends Error {
    readonly pos: number;
    constructor(message: string, pos: number);
}
interface Span {
    s: number;
    e: number;
}
export type Token = Span & ({
    t: 'num';
    v: number;
} | {
    t: 'str';
    v: string;
} | {
    t: 'bool';
    v: boolean;
} | {
    t: 'err';
    v: ErrorCode;
    sheet?: string;
} | {
    t: 'ref';
    ref: RefAddr;
    sheetText?: string;
} | {
    t: 'func';
    v: string;
} | {
    t: 'name';
    v: string;
    sheet?: string;
} | {
    t: 'op';
    v: string;
} | {
    t: 'punc';
    v: string;
} | {
    t: 'ws';
});
/** Try to read an A1 reference (cell, area, A:B, 1:2) at i. */
export declare function readRef(src: string, i: number): {
    ref: RefAddr;
    end: number;
} | null;
export declare function stripFnPrefix(name: string): string;
export declare function tokenize(src: string): Token[];
/** Parse a plain reference string (INDIRECT): `A1`, `Sheet1!A1:B2`, `'x y'!C:C`, `3:3`. */
export declare function parseRefText(text: string): RefAddr | null;
export {};
