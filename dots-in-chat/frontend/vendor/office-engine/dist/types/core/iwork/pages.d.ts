import type { IworkPackage } from './iwa';
import { type ParaProps } from './styles';
/** a drawable converted for the flow: inline content of a run, or a block (table) */
type Out = {
    run: string;
} | {
    block: string;
};
interface StorageOpts {
    /** runs put at the start of the first paragraph */
    prefix?: string;
    /** paragraph style of paragraphs without one (table cells) */
    baseStyle?: number;
    /** alignment of every paragraph (the left / center / right parts of a header) */
    align?: ParaProps['align'];
}
export declare class PagesConverter {
    private pkg;
    private st;
    private media;
    private styleXml;
    private nums;
    private abstractNums;
    private numXml;
    private notes;
    private noteFormat;
    private docPr;
    private depth;
    private part;
    private contentWidth;
    /** header / footer parts and their XML */
    private hf;
    private runCache;
    constructor(pkg: IworkPackage);
    /** w:rPr of text in a paragraph style and a character style: the character style wins over the paragraph's variations */
    private runPr;
    /** w:styleId of the named paragraph style a style id resolves to (emitted on first use) */
    private paraStyleId;
    private charStyleId;
    /** w:numId of a list style (undefined: no labels) */
    private numId;
    /** WordprocessingML blocks of a TSWP.StorageArchive */
    storage(id: number | undefined, opts?: StorageOpts): string;
    private attachment;
    private noteLabel;
    private noteRef;
    /** geometry size of a drawable (DrawableArchive nested `nest` levels deep), no wider than the text column */
    private size;
    /** the flow content of a drawable */
    drawable(id: number | undefined): Out[];
    private image;
    /** a shape: a text box (or a plain filled box) in the flow */
    private shape;
    private cellFill;
    private table;
    /** paragraphs of plain text in a paragraph style */
    private plain;
    convert(): Promise<Blob>;
    /** header / footer content: its three storages (left, center, right); undefined when all are empty */
    private headerFooter;
    private hasText;
    /** floating drawables, grouped by page, each page's in reading order */
    private floating;
    private pack;
}
/** Converts an opened Pages package to a DOCX file. */
export declare function pagesToDocx(pkg: IworkPackage): Promise<Blob>;
export {};
