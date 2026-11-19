/** px size of a CSS font size ('11pt', px number), `base` when unset */
export declare const fontPx: (v: string | number | undefined, base: number) => number;
/**
 * Excel-like: a General number gives up decimals to fit the column, then goes scientific when its integer part does
 * not fit, and shows ### only when not even that fits. A formatted number (1,234.50 / 12%) cannot change: ###.
 *
 * With `font` (the CSS font the cell is drawn in) the text is measured: the font a browser has for a sheet's is not
 * always as narrow as Calibri, and a number wider than its cell would be shown without its first digits. Without
 * it, or where nothing measures, a digit counts for the width Calibri gives it.
 */
export declare function fitNumber(text: string, width: number, px: number, font?: string): string;
