import type { RefAddr } from './refs';
import type { ErrorCode, Value } from './types';
export type BinOp = '+' | '-' | '*' | '/' | '^' | '&' | '=' | '<>' | '<' | '>' | '<=' | '>=';
export type Ast = {
    type: 'num';
    value: number;
} | {
    type: 'str';
    value: string;
} | {
    type: 'bool';
    value: boolean;
} | {
    type: 'err';
    code: ErrorCode;
} | {
    type: 'missing';
} | {
    type: 'ref';
    ref: RefAddr;
} | {
    type: 'name';
    name: string;
    sheet?: string;
} | {
    type: 'array';
    rows: Value[][];
} | {
    type: 'unary';
    op: '-' | '+';
    arg: Ast;
} | {
    type: 'percent';
    arg: Ast;
} | {
    type: 'binary';
    op: BinOp;
    left: Ast;
    right: Ast;
} | {
    type: 'range';
    left: Ast;
    right: Ast;
} | {
    type: 'union';
    items: Ast[];
} | {
    type: 'call';
    name: string;
    args: Ast[];
};
/** Parse formula text (OOXML stored form, without '='; a leading '=' is tolerated). Throws FormulaSyntaxError. */
export declare function parseFormula(text: string): Ast;
