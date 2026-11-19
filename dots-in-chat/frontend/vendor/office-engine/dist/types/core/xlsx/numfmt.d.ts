/** Round a nonnegative value's 15 significant decimal digits without returning to binary. */
export declare function fixedDecimal(v: number, decimals: number): string;
/**
 * Index of the format section Excel applies to n: the second for negatives, the third for zero, otherwise the
 * first. When the section is empty (`;;;`, `0;;"z"`) the value shows nothing, which is returned as null.
 */
export declare function pickSection(n: number, count: number, isEmpty: (i: number) => boolean): number | null;
export declare const BUILTIN_FORMATS: Record<number, string>;
export declare function isDateFormat(fmt: string): boolean;
/**
 * The General format: what Excel shows of a number in `max` characters (11 at most): the decimals that fit, rounded,
 * and scientific notation when the integer part does not fit or the number is below 1E-4. `#` when not even that fits.
 */
export declare function formatGeneral(v: number, max?: number): string;
export declare function serialToDate(serial: number, date1904?: boolean): Date;
export interface Formatted {
    text: string;
    color?: string;
    /** a date outside the serials Excel has (TEXT() gives #VALUE!; a cell shows ########) */
    invalid?: boolean;
}
/**
 * A number as a cell with the format `fmt` shows it. `forText`: as TEXT() has it, which does not put a minus sign
 * on what shows as zero (-0.004 as 0.00), and tells a date out of range.
 */
export declare function formatValue(v: number, fmt: string | undefined, date1904?: boolean, forText?: boolean): Formatted;
export declare function formatText(s: string, fmt: string | undefined): string;
