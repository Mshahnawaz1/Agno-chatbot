import type { IworkPackage } from './iwa';
export declare class KeynoteConverter {
    private pkg;
    private st;
    private media;
    private part;
    private ids;
    private depth;
    private slideIndex;
    constructor(pkg: IworkPackage);
    private image;
    /** a:p elements of a text storage */
    private storage;
    /** a text attachment: the slide number field (others have no text of their own here) */
    private field;
    private hasText;
    private nv;
    /** the TSD.DrawableArchive inside a drawable object */
    private drawableArchive;
    /** spTree content of a drawable; `offset` moves a group's children */
    drawable(id: number | undefined, offset?: {
        x: number;
        y: number;
    }): string;
    /** a text box, placeholder or shape (TSWP.ShapeInfoArchive or TSD.ShapeArchive) */
    private shape;
    /** an image (or a movie's poster frame), cropped by its mask */
    private picture;
    /**
     * A group: children are drawn at their own place. Their frames are in the group's coordinates when they fall
     * inside the group's size but not inside its frame on the slide.
     */
    private group;
    private cellFill;
    private table;
    /** paragraphs of plain text in a paragraph style */
    private plain;
    /** p:bg of a slide (its style's fill, else its master's) */
    private background;
    /** drawables of a slide, back to front */
    private order;
    /** the slides in show order, with their skipped flag */
    private slideList;
    convert(): Promise<Blob>;
}
/** Converts an opened Keynote package to a PPTX file. */
export declare function keynoteToPptx(pkg: IworkPackage): Promise<Blob>;
