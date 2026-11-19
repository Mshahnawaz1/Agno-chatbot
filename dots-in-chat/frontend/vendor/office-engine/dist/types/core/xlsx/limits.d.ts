/** OOXML worksheet limits. Imported CSV row counts and the generic view axes may exceed these. */
export declare const MAX_COL = 16384;
export declare const MAX_ROWS = 1048576;
export declare const MAX_ROW_HEIGHT_PT = 409.5;
export declare const MAX_COL_WIDTH = 255;
/** Conservative drawing geometry budget: a whole worksheet at its largest cell sizes, in CSS px. */
export declare const MAX_SHEET_WIDTH_PX: number;
export declare const MAX_SHEET_HEIGHT_PX: number;
export declare function ooxmlNumber(value: string | undefined, min: number, max: number): number | undefined;
/**
 * A size of the file, at most `max`: a width or a height past what Excel allows is the largest it allows (other
 * programs write them, and show them). Undefined when it is no number, or under `min`.
 */
export declare function ooxmlCapped(value: string | undefined, min: number, max: number): number | undefined;
export declare function ooxmlInt(value: string | undefined, min: number, max: number): number | undefined;
