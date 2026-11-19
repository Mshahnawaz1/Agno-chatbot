import { type Value } from './types';
export { fixedDecimal, pickSection } from '../numfmt';
/** Round half away from zero to d decimals, removing binary noise first. */
export declare function roundHalf(x: number, d: number): number;
/** TEXT(value, format). Throws FormulaError on invalid input. */
export declare function formatText(v: Value, fmt: string): string;
