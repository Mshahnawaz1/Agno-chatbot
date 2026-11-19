export interface Font {
    /** twips */
    height: number;
    italic: boolean;
    strike: boolean;
    outline: boolean;
    shadow: boolean;
    /** color index */
    color: number;
    weight: number;
    /** 0 none, 1 superscript, 2 subscript */
    script: number;
    underline: number;
    family: number;
    charset: number;
    name: string;
}
export interface Xf {
    font: number;
    fmt: number;
    locked: boolean;
    hidden: boolean;
    style: boolean;
    hAlign: number;
    wrap: boolean;
    vAlign: number;
    rotation: number;
    indent: number;
    shrink: boolean;
    readingOrder: number;
    /** line styles left, right, top, bottom, diagonal */
    lines: number[];
    /** line colors left, right, top, bottom, diagonal */
    lineColors: number[];
    /** 1 down (top-left to bottom-right), 2 up */
    diagonal: number;
    pattern: number;
    fore: number;
    back: number;
    /** XFEXT colors ('RRGGBB') by extension type: 4 fill, 5 pattern background, 7-11 top / bottom / left / right / diagonal line, 13 text */
    ext?: Map<number, string>;
}
/** a FONT record (the name read by the caller) */
export declare function readFont(b: Uint8Array, name: string): Font;
/** an XF record: 20 bytes in BIFF8, 16 in BIFF5 */
export declare function readXf(b: Uint8Array, biff: 5 | 8): Xf;
/** the colors of the color indexes: 8 fixed, 56 in the palette (PALETTE changes them) */
export declare class Palette {
    readonly colors: string[];
    /** a PALETTE record */
    read(b: Uint8Array): void;
    /** 'RRGGBB', or undefined for the system / automatic colors */
    rgb(icv: number): string | undefined;
}
/** styles.xml from the workbook's fonts, formats and XFs; each font, fill, border and cell format written once */
export declare class XlsxStyles {
    private fonts;
    private xfs;
    private formats;
    private palette;
    private fontIds;
    private fontXml;
    private fillIds;
    private fillXml;
    private borderIds;
    private borderXml;
    private xfIds;
    private xfXml;
    /** BIFF XF index → cellXfs index */
    private map;
    constructor(fonts: Font[], xfs: Xf[], formats: Map<number, string>, palette: Palette);
    /** a BIFF font index (index 4 is never used: 5 and above count from 4) */
    private font;
    private color;
    private fontId;
    /** the run properties of rich text in a font */
    runProps(i: number): string;
    private fillId;
    private borderId;
    /** the cellXfs index of a BIFF XF index */
    cell(i: number): number;
    xml(): string;
}
/** an XFEXT record (Excel 2007+): the full colors of an XF, which keeps the nearest palette color */
export declare function readXfExt(b: Uint8Array, xfs: Xf[], palette: Palette, theme?: Record<string, string>): void;
/** the colors of a theme part (theme1.xml), as 'RRGGBB' by name */
export declare function themeColors(xml: string): Record<string, string>;
