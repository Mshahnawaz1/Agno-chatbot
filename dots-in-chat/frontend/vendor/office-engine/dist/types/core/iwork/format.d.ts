import type { Msg } from './proto';
export type CellKind = 'number' | 'text' | 'date' | 'bool' | 'duration' | 'error' | 'rich';
/** TSK.FormatStructArchive.format_type */
export declare const FMT: {
    readonly BOOLEAN: 1;
    readonly DECIMAL: 256;
    readonly CURRENCY: 257;
    readonly PERCENT: 258;
    readonly SCIENTIFIC: 259;
    readonly TEXT: 260;
    readonly DATE: 261;
    readonly FRACTION: 262;
    readonly CHECKBOX: 263;
    readonly RATING: 267;
    readonly DURATION: 268;
    readonly BASE: 269;
};
export declare const toSerial: (seconds: number) => number;
/** ICU date pattern ("MMM d, yyyy h:mm a") → Excel date code */
export declare function excelDate(icu: string, lower?: boolean): string;
/** a format's Excel code; undefined: General (or no Excel equivalent). Cached per format object. */
export declare function excelFormat(f: Msg | undefined, kind: CellKind, lower?: boolean, value?: number): string | undefined;
/** a duration as Numbers shows it: compact "1:02:03", short "1h 2m 3s" or long "1 hour 2 minutes 3 seconds" */
export declare function durationText(value: number, f: Msg | undefined): string;
/** a document's locale writes "pm" rather than "PM" */
export declare const lowerAmPm: (locale: string | undefined) => boolean;
/** the text a cell shows */
export declare function shownText(kind: CellKind, value: number, f: Msg | undefined, lower?: boolean): string;
