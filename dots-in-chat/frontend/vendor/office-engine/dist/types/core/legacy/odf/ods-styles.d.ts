import { type OdfStyles } from './common';
export interface Font {
    name: string;
    sz: number;
    b?: boolean;
    i?: boolean;
    u?: 'single' | 'double';
    strike?: boolean;
    va?: 'superscript' | 'subscript';
    color?: string;
}
export interface Side {
    style: string;
    color: string;
}
export interface Look {
    font: Font;
    fill?: string;
    /** left, right, top, bottom, diagonal (with up / down) */
    borders: (Side | undefined)[];
    diagUp?: boolean;
    diagDown?: boolean;
    numFmt?: string;
    h?: string;
    v?: string;
    wrap?: boolean;
    shrink?: boolean;
    rotate?: number;
    indent?: number;
}
/** an ODF border ("0.06pt solid #000000") as an Excel border side */
export declare function borderSide(v: string | undefined): Side | undefined;
/** the look of a cell style (its properties merged with those it inherits) */
export declare function lookOf(styles: OdfStyles, name: string | undefined, base: Font): Look;
/** the data style of a cell style (style:data-style-name, from the style or what it inherits) */
export declare function dataStyleOf(styles: OdfStyles, name: string): string | undefined;
/** styles.xml: fonts, fills, borders, number formats and cell formats, each written once */
export declare class StyleTable {
    private fonts;
    private fills;
    private borders;
    private formats;
    private xfs;
    private fontXml;
    private fillXml;
    private borderXml;
    private formatXml;
    private xfXml;
    /** the first cell format (and font) is the default one */
    constructor(base: Look);
    private id;
    private font;
    private fill;
    private border;
    private numFmt;
    /** index of the cell format with this look */
    xf(l: Look): number;
    xml(): string;
}
/** cell formats of ODF cell styles (with a fallback number format for values whose style has none) */
export declare class CellFormats {
    private styles;
    readonly table: StyleTable;
    readonly base: Font;
    private looks;
    private cache;
    constructor(styles: OdfStyles);
    look(name: string): Look;
    /** whether a style gives a value a number format */
    hasFormat(name: string): boolean;
    /**
     * The cell format index of a style, `fallback` being the number format to use when the style has none;
     * `wrap` for text of several lines (shown so even when the style does not wrap).
     */
    xf(name: string, fallback?: string, wrap?: boolean): number;
}
