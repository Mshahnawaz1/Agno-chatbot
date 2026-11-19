import type { Cfb } from '../cfb';
export declare class PptConverter {
    private doc;
    private blips;
    private files;
    private overrides;
    private masterRecs;
    private mainMasters;
    private masterShapes;
    private outMasters;
    private outLayouts;
    private styleCache;
    private mediaNames;
    private mediaExts;
    /** output slide number by PPT slide id */
    private slideNumbers;
    /** comment authors (name and initials) by name */
    private authors;
    constructor(cfb: Cfb);
    private styles;
    private media;
    private patterns;
    private pattern;
    /** hlinkClick of an InteractiveInfo container */
    private link;
    /** the 8 colors of a container's own scheme */
    private ownScheme;
    /** the scheme in effect on a master (a title master may follow its main master's) */
    private schemeOf;
    private env;
    private writer;
    convert(): Promise<Blob>;
    /** the output master of a main master with a scheme */
    private outMaster;
    private layout;
    /** writes a slide; returns its notes page */
    private slide;
    /** a slide's comments (PowerPoint 2002 Comment10 records) as legacy PPTX comments */
    private comments;
    /** a slide master: background, shapes (placeholders included), text styles, theme; returns the next free id */
    private masterXml;
    /** a layout: a title master's look, or the main master's placeholders */
    private layoutXml;
    private notesMasterXml;
}
