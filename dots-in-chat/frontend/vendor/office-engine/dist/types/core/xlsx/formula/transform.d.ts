import type { Ast } from './parser';
import { type CellRef, type RangeRef } from './types';
/** Copy/fill: shift relative parts of every reference by (dr, dc). Out-of-sheet results become #REF!. */
export declare function translateFormula(text: string, dr: number, dc: number): string;
/**
 * `translateFormula` of one text by many offsets (the cells of a shared formula): the text is read once.
 * Unlexable text is returned unchanged, as there.
 */
export declare function translator(text: string): (dr: number, dc: number) => string;
export interface ShiftOp {
    /** sheet whose rows/cols change (undefined: the formula's own sheet) */
    sheet?: string;
    /** sheet the formula lives on (unqualified refs belong to it; undefined: same as `sheet`) */
    formulaSheet?: string;
    axis: 'row' | 'col';
    /** 0-based index of the first inserted/deleted row/col */
    at: number;
    /** >0 insert count, <0 delete count */
    delta: number;
}
/** Rewrite references after inserting/deleting rows or columns. */
export declare function shiftFormula(text: string, op: ShiftOp): string;
/** cells moved from one place to another (cut and pasted): the block, as it was, and how far it went */
export interface MoveOp {
    from: string;
    to: string;
    r0: number;
    c0: number;
    r1: number;
    c1: number;
    dr: number;
    dc: number;
}
/**
 * Rewrite references after cells were moved: a reference to cells of the block (all of them inside it) follows them,
 * the others stay. `home`: the sheet the formula is on now; `was`: the sheet it was on, for a formula that moved with
 * the block to another sheet (what it read of its old sheet, it still reads there).
 */
export declare function moveRefsInFormula(text: string, op: MoveOp, home: string, was?: string): string;
/** References to a sheet that is no more (deleted): each becomes #REF!, as the names and errors qualified by it. */
export declare function dropSheetInFormula(text: string, name: string): string;
/** Rename sheet qualifiers (`Old!A1`, `'Old'!A1:B2`, `Old!#REF!`, `Old!Name`). */
export declare function renameSheetInFormula(text: string, oldName: string, newName: string): string;
/** The formula as a file holds it: the functions newer than the format given their prefix (one typed has none). */
export declare function withFunctionPrefixes(text: string): string;
/** The formula as it is typed: without the prefixes a file gives the newer functions. */
export declare function stripFunctionPrefixes(text: string): string;
/** whether the formula calls a volatile function */
export declare function isVolatile(ast: Ast): boolean;
/** Every cell/range the formula reads directly (static references; INDIRECT/OFFSET targets are dynamic). */
export declare function references(ast: Ast): (CellRef | RangeRef)[];
