type Css = Record<string, string | number | undefined>;
type Base = {
    fontFamily?: string;
    fontSize?: string | number;
};
/** the CSS font of a cell: its style over the workbook's base font */
export declare function fontOf(css: Css, base: Base, basePx: number): string;
/** width in px of the widest line of `text` as a cell with this style draws it */
export declare function textWidth(text: string, css: Css, base: Base, basePx: number): number;
/** height in px of `text` wrapped in a cell `width` px wide (the line height and bottom padding of `.de-cell`) */
export declare function wrapHeight(text: string, css: Css, base: Base, basePx: number, width: number): number;
/** height in px a row needs to show a line of `text` turned by `rot` degrees (255: stacked, a letter per line) */
export declare function rotatedHeight(text: string, css: Css, base: Base, basePx: number, rot: number): number;
export {};
