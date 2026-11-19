import { type RefAddr } from './refs';
export interface FormulaRef {
    /** span in the full text (including the leading '=') */
    s: number;
    e: number;
    text: string;
    ref: RefAddr;
}
export interface FormulaContext {
    /** identifier right before the caret (to autocomplete); span in the full text */
    word?: {
        s: number;
        e: number;
        text: string;
        call: boolean;
    };
    /** innermost function call around the caret; arg is 0-based */
    call?: {
        name: string;
        arg: number;
    };
    /** a reference can be inserted at the caret */
    pointable: boolean;
    refs: FormulaRef[];
}
export declare const isFormula: (text: string) => boolean;
/** Context of the caret inside formula `text` (full cell text, starting with '='). */
export declare function formulaContext(text: string, caret: number): FormulaContext;
/** Reference text for a selected block (`A1`, `A1:B3`, `A:A`, `1:1`), sheet-qualified when `sheet` is given. */
export declare function rangeText(r0: number, c0: number, r1: number, c1: number, sheet?: string): string;
/**
 * What Excel does on Enter: upper-cases function names, references and booleans,
 * closes an unterminated string and open parentheses.
 */
export declare function closeFormula(text: string): string;
