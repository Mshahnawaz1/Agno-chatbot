/** Function-definition plumbing: evaluator interface, arity, array lifting, argument visitors. */
import type { Ast } from './parser';
import { FormulaError, type Value } from './types';
import { RangeV, type Val } from './values';
/** What a function implementation may ask of the evaluator. */
export interface Ev {
    readonly sheet: string | undefined;
    /** 0-based formula cell position */
    readonly r: number;
    readonly c: number;
    eval(ast: Ast, top: boolean): Val;
    cell(sheet: string | undefined, r: number, c: number): Value;
    /** visit cells of a range (whole-row/col ranges clipped to the provider's bounds) */
    forEach(rg: RangeV, cb: (v: Value, i: number, j: number) => void): void;
    /** 2-D values of a range/array/scalar (clipped like forEach); unions -> #VALUE! thrown */
    toArray(v: Val): Value[][];
    /** single value: 1x1 range -> cell, larger range -> implicit intersection, array -> top-left */
    scalar(v: Val): Value;
    /** operator operand: scalar, or 2-D data when array-evaluated (top=false) */
    operand(v: Val, top: boolean): Value | Value[][];
    hasSheet(name: string): boolean;
    now(): Date;
}
export type EagerFn = (args: Val[], ev: Ev, top: boolean) => Val;
export type LazyFn = (args: Ast[], ev: Ev, top: boolean) => Val;
export type FnDef = 
/** args evaluated first; `scalarArgs` => args inherit the caller's top-level (implicit intersection) context */
{
    kind: 'eager';
    min: number;
    max: number;
    scalarArgs: boolean;
    fn: EagerFn;
}
/** receives unevaluated args (IF, IFERROR, CHOOSE, ...) */
 | {
    kind: 'lazy';
    min: number;
    max: number;
    fn: LazyFn;
};
export declare const INF: number;
/** Run f, converting a thrown FormulaError into a value. */
export declare function guard<T>(f: () => T): T | FormulaError;
/** Pick (i,j) from 2-D data with 1-row/1-col broadcasting; out of shape -> #N/A. */
export declare function pick(d: Value[][], i: number, j: number): Value;
/**
 * Scalar function, lifted element-wise over array arguments (array formulas / SUMPRODUCT(LEN(A1:A3))).
 * At the formula top level a multi-cell range argument is implicitly intersected instead.
 */
export declare function S(min: number, max: number, f: (a: Value[], ev: Ev) => Value): FnDef;
/** Function taking ranges/arrays as-is (args evaluated in array context). */
export declare function A(min: number, max: number, fn: EagerFn): FnDef;
/**
 * A function over ranges that also takes single values (the criterion of COUNTIF, the rank of LARGE, the value
 * VLOOKUP looks up): given an array where it takes one (`single` says which arguments), it computes once per
 * element and gives an array. `SUM(COUNTIF(r,{"x","y"}))` counts both, `SUMPRODUCT(1/COUNTIF(r,r))` each cell of r.
 * A range there is taken whole too, unless the formula's own cell picks one of it (the top level).
 */
export declare function lift(single: (i: number, n: number) => boolean, fn: EagerFn): EagerFn;
/** Lazy function (receives ASTs). */
export declare function L(min: number, max: number, fn: LazyFn): FnDef;
/** Visit every value of an argument: cells/array items via `inRange`, direct scalars via `direct`. */
export declare function visit(a: Val, ev: Ev, inRange: (v: Value) => void, direct: (v: Value) => void): void;
/** Numbers of aggregate args: ranges contribute numbers only, direct scalars coerce; errors throw. */
export declare function eachNum(args: Val[], ev: Ev, cb: (n: number) => void): void;
export declare function nums(args: Val[], ev: Ev): number[];
/** Flatten a range/array to a row-major list. */
export declare function flat(d: Value[][]): Value[];
/** Optional numeric arg i (missing argument => 0 like Excel; absent => def). */
export declare function opt(a: Value[], i: number, def: number): number;
