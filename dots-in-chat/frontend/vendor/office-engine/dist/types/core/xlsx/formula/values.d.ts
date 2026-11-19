import { FormulaError, type Value } from './types';
/** Reference to a rectangular block of cells (0-based inclusive). */
export declare class RangeV {
    readonly sheet: string | undefined;
    readonly r0: number;
    readonly c0: number;
    readonly r1: number;
    readonly c1: number;
    constructor(sheet: string | undefined, r0: number, c0: number, r1: number, c1: number);
    get h(): number;
    get w(): number;
}
/** In-memory array (array constants and array-evaluated results). Always at least 1x1. */
export declare class ArrayV {
    readonly data: Value[][];
    constructor(data: Value[][]);
    get h(): number;
    get w(): number;
}
/** Multi-area reference `(A1:B2,D4)`. */
export declare class UnionV {
    readonly areas: RangeV[];
    constructor(areas: RangeV[]);
}
export type Val = Value | RangeV | ArrayV | UnionV;
export declare const isErr: (v: unknown) => v is FormulaError;
/** Numeric text -> number (plain, 1,234.5, (5), 50%, $3, 1E3, 1 1/2, dates, times); null when not numeric. */
export declare function parseNumberText(s: string): number | null;
/** Excel "General" text of a number (15 significant digits). */
export declare function numToText(n: number): string;
export declare function toNum(v: Value): number | FormulaError;
export declare function toStr(v: Value): string | FormulaError;
export declare function toBool(v: Value): boolean | FormulaError;
export declare function num(v: Value): number;
export declare function int(v: Value): number;
export declare function str(v: Value): string;
export declare function bool(v: Value): boolean;
/** Throw if v is an error, else return it. */
export declare function check<T extends Value>(v: T): Exclude<T, FormulaError>;
export declare function numEq(a: number, b: number): boolean;
/** text order: plain ASCII (letters, digits, spaces) sorts as its lower case does, the rest by collation */
export declare function compareText(a: string, b: string): number;
/** Excel ordering: numbers < text < booleans; text case-insensitive; empty adopts the other side's type. Errors not allowed. */
export declare function compare(a: Value, b: Value): number;
/** Lookup equality: same type, text case-insensitive. */
export declare function valueEq(a: Value, b: Value): boolean;
export declare const hasWildcard: (s: string) => boolean;
export declare function wildcardRe(pat: string, anchored?: boolean): RegExp;
export type Matcher = (v: Value) => boolean;
/** Criteria of COUNTIF/SUMIF/...: "<5", ">=10", "<>x", "=abc", "a*c", 3, TRUE, "" (blank). */
export declare function criteria(crit: Value): Matcher;
