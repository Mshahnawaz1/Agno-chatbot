import type { IworkPackage } from './iwa';
export declare class NumbersConverter {
    private pkg;
    private st;
    private styles;
    private strings;
    private lower;
    constructor(pkg: IworkPackage);
    private sst;
    /** a TST.CellStyleArchive property, from the style or its ancestors */
    private cellProp;
    private cellLooks;
    /** what a cell style sets: fill ('' none), vertical alignment, wrap (undefined: not set) */
    private cellLook;
    private xfs;
    private strokeIds;
    /** the cell format of a look, by a cheap key (text style, fill, format, alignment, lines) */
    private xf;
    /** plain text of a rich text cell */
    private richText;
    /** a worksheet with the cells of a table */
    private sheet;
    convert(): Promise<Blob>;
}
/** Converts an opened Numbers package to an XLSX file. */
export declare function numbersToXlsx(pkg: IworkPackage): Promise<Blob>;
