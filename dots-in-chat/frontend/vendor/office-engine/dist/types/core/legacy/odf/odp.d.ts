import { type OdfPackage } from './common';
export declare class OdpConverter {
    private pkg;
    private styles;
    private media;
    private files;
    private overrides;
    private masters;
    private hidden;
    private pages;
    /** slide index by page name ("page2", "Slide 2", custom names) */
    private pageIndex;
    private decls;
    private layoutCount;
    private themeCount;
    private W;
    private H;
    constructor(pkg: OdfPackage);
    private file;
    private env;
    private link;
    private placeholderBox;
    private readMasters;
    private masterOf;
    /** the background of a master: its drawing-page style over its "-background" presentation style */
    private masterBackground;
    private masterParts;
    /** a placeholder shape of a master or layout */
    private phShape;
    private styleProps;
    private writeMaster;
    private nextLayoutId;
    /** a layout of a master: title and content, title (with a subtitle), blank */
    private layout;
    /** a theme for a master: its LibreOffice theme colors, the title and body fonts */
    private writeTheme;
    private decl;
    private writeSlide;
    /** comment authors by name: id, initials, comment count */
    private authors;
    /** the annotations of a page → its (legacy) PowerPoint comments, positions in 1/576 inch */
    private comments;
    private notesMaster;
    private notesSlide;
    convert(): Promise<Blob>;
}
/** Converts an OpenDocument presentation to a PPTX file. */
export declare function odpToPptx(pkg: OdfPackage): Promise<Blob>;
