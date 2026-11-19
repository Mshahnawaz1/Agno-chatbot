/** Excel formula engine: parse, evaluate, rewrite (fill / insert-delete / rename) and dependency extraction. */
export { ERROR_CODES, EvalSignal, FormulaError, MAX_COL, MAX_ROW, UnsupportedFormula } from './types';
export type { CellProvider, CellRef, ErrorCode, EvalContext, RangeRef, Value } from './types';
export { FormulaSyntaxError } from './lexer';
export { parseFormula } from './parser';
export type { Ast, BinOp } from './parser';
export type { RefAddr } from './refs';
export { colIndex, colName, quoteSheet } from './refs';
export { evaluate, evaluateArray, evaluateFormula } from './evaluate';
export { dropSheetInFormula, isVolatile, moveRefsInFormula, references, renameSheetInFormula, shiftFormula, stripFunctionPrefixes, translateFormula, translator, withFunctionPrefixes } from './transform';
export type { MoveOp, ShiftOp } from './transform';
export { supportedFunctions } from './functions';
export { numToText, parseNumberText } from './values';
export { closeFormula, formulaContext, isFormula, rangeText } from './assist';
export type { FormulaContext, FormulaRef } from './assist';
export { argSlot, functionCatalog, functionInfo, suggestFunctions } from './catalog';
export type { FnInfo } from './catalog';
