import { type Ev } from './fn';
import { type Ast, type BinOp } from './parser';
import { type CellProvider, type EvalContext, type Value } from './types';
import { RangeV, type Val } from './values';
export declare function binop(op: BinOp, a: Value, b: Value, last?: boolean): Value;
type Operand = Value | Value[][];
export declare class Evaluator implements Ev {
    readonly provider: CellProvider;
    readonly sheet: string | undefined;
    readonly r: number;
    readonly c: number;
    private readonly strict;
    /** the formula being evaluated: its last operation is the one that rounds noise to zero */
    private root;
    /** the larger extent of the sheets the whole columns / rows of the formula are on (see `clip`) */
    private extent;
    constructor(ctx: EvalContext, root?: Ast);
    /** what the engine cannot compute: #NAME?, or the evaluation stopped (`EvalContext.strict`) */
    private unsupported;
    eval(ast: Ast, top: boolean): Val;
    private ref;
    private rangeOp;
    private call;
    hasSheet(name: string): boolean;
    now(): Date;
    cell(sheet: string | undefined, r: number, c: number): Value;
    /**
     * The rows and columns of the longest sheet among those the formula has whole columns / rows of: `A:A` and `B:B` of
     * two sheets must have the same size (SUMPRODUCT(Data!C:C,T!A:A)), as they do in Excel, without reading the blank
     * rows of a million.
     */
    private wholeExtent;
    /** Clip whole-row/whole-column style ranges to the provider's used extent. */
    private clip;
    forEach(rg: RangeV, cb: (v: Value, i: number, j: number) => void): void;
    /** The values of a range / array / scalar as rows. Those of a range may be shared (see `CellProvider.block`): read, never changed. */
    toArray(v: Val): Value[][];
    /** Implicit intersection of a range with the formula cell's row/column. */
    intersect(rg: RangeV): Value;
    scalar(v: Val): Value;
    operand(v: Val, top: boolean): Operand;
}
/**
 * Evaluate a parsed formula for the cell at ctx.{sheet,r,c}. Errors come back as FormulaError; it throws nothing but
 * an `EvalSignal` (one the provider throws, or `UnsupportedFormula` when `ctx.strict`).
 */
export declare function evaluate(ast: Ast, ctx: EvalContext): Value;
/**
 * Evaluate an array formula (entered over `h` × `w` cells): no implicit intersection at the top, and a value for
 * each cell. A result of one row / column / value repeats over the cells; cells past a larger one are #N/A.
 */
export declare function evaluateArray(ast: Ast, ctx: EvalContext, h: number, w: number): Value[][];
/** Parse + evaluate. Syntax errors evaluate to #NAME?. */
export declare function evaluateFormula(text: string, ctx: EvalContext): Value;
export {};
