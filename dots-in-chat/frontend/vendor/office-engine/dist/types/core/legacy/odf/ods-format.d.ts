/**
 * OpenDocument data styles (number:number-style, currency-style, percentage-style, date-style, time-style,
 * boolean-style, text-style, with their style:map conditions) → Excel number format codes.
 */
import { type OdfStyles } from './common';
/** a literal in a format code: characters that mean nothing in a code stay as they are, the rest is quoted */
export declare function literal(s: string, date?: boolean): string;
/**
 * The Excel format code of a data style, undefined for none (or General). Conditions (style:map) become the
 * sections of the code: "≥0" makes the usual positive;negative pair, others become [condition] sections.
 */
export declare function excelFormat(styles: OdfStyles, name: string | undefined): string | undefined;
/** the format of a value with no data style that Excel would otherwise show as a bare number */
export declare function fallbackFormat(valueType: string, value: number, currency?: string): string | undefined;
