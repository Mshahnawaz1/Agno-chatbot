/** Core value / reference / provider types of the formula engine. */
export type ErrorCode = '#DIV/0!' | '#VALUE!' | '#REF!' | '#NAME?' | '#N/A' | '#NUM!' | '#NULL!' | '#SPILL!' | '#CALC!';
/** ERROR.TYPE order (1-based). */
export declare const ERROR_CODES: readonly ErrorCode[];
/** the errors of dynamic arrays, which ERROR.TYPE numbers apart from the seven above */
export declare const ERROR_TYPE_EXTRA: Readonly<Record<string, number>>;
export declare class FormulaError {
    readonly code: ErrorCode;
    constructor(code: ErrorCode);
    toString(): string;
}
/** null = empty cell */
export type Value = number | string | boolean | FormulaError | null;
/** 0-based cell reference. */
export interface CellRef {
    sheet?: string;
    r: number;
    c: number;
    absR: boolean;
    absC: boolean;
}
/** 0-based inclusive range. Whole column A:A => r0=0, r1=MAX_ROW; whole row 1:1 => c0=0, c1=MAX_COL. */
export interface RangeRef {
    sheet?: string;
    r0: number;
    c0: number;
    r1: number;
    c1: number;
}
export interface CellProvider {
    /** value of a cell; formula cells return their current computed value */
    value(sheet: string | undefined, r: number, c: number): Value;
    /**
     * The cells of a block, row by row: what `value` gives for each, read faster than one by one (optional). A cell
     * without anything is null.
     */
    read?(sheet: string | undefined, r0: number, c0: number, r1: number, c1: number, cb: (v: Value, i: number, j: number) => void): void;
    /**
     * The cells of a block as rows of values, when the provider keeps them (optional): a table every row of a sheet
     * looks up is read once, not once per row. What it gives is shared: never changed in place.
     */
    block?(sheet: string | undefined, r0: number, c0: number, r1: number, c1: number): Value[][] | undefined;
    /** used extent of a sheet, to clip whole-row/column ranges (optional) */
    bounds?(sheet: string | undefined): {
        rows: number;
        cols: number;
    };
    /** sheet exists? (unknown sheet -> #REF!) optional */
    hasSheet?(name: string): boolean;
    date1904?: boolean;
    now?(): Date;
}
export interface EvalContext {
    provider: CellProvider;
    /** sheet the formula lives on (unqualified refs resolve here) */
    sheet?: string;
    /** 0-based position of the formula cell */
    r: number;
    c: number;
    /**
     * A function the engine does not have, or a defined name, stops the evaluation with an `UnsupportedFormula` thrown
     * (the caller keeps the value it has), where it otherwise evaluates to #NAME? (which IFERROR and the like take
     * for an error of the data, and hide).
     */
    strict?: boolean;
}
/**
 * Thrown through an evaluation, by the provider or the evaluator, to stop it: never turned into a value (no function
 * catches it, `evaluate` lets it out).
 */
export declare class EvalSignal extends Error {
}
/** the formula uses what the engine cannot compute: a function it does not have, a defined name */
export declare class UnsupportedFormula extends EvalSignal {
}
export declare const MAX_ROW = 1048575;
/**
 * Last row a formula may name: a sheet read from a large text file has rows past Excel's last (the evaluator takes a
 * reference there for a name unless the sheet has that row).
 */
export declare const MAX_REF_ROW = 268435455;
export declare const MAX_COL = 16383;
export declare const ERR: {
    readonly DIV0: FormulaError;
    readonly VALUE: FormulaError;
    readonly REF: FormulaError;
    readonly NAME: FormulaError;
    readonly NA: FormulaError;
    readonly NUM: FormulaError;
    readonly NULL: FormulaError;
};
