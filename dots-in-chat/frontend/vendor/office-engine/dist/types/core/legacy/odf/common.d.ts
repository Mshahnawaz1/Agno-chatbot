import type { ZipArchive } from '../../zip';
/** an element: qualified name with the usual ODF prefix (office:, style:, text:, table:, draw:, fo:…), attributes decoded */
export interface ONode {
    name: string;
    attrs: Record<string, string>;
    /** child elements and text, in document order (text decoded; whitespace kept as is) */
    kids: (ONode | string)[];
}
/**
 * Parses XML into ONodes (the root element); namespace prefixes are made the canonical ODF ones. One pass straight
 * to the tree (a large spreadsheet's content.xml is 100 MB and more); a namespace scope is copied only by the
 * elements that declare one.
 */
export declare function parseOdfXml(xml: string): ONode;
export declare const isEl: (x: ONode | string | undefined) => x is ONode;
/** the first child element with the name */
export declare const child: (n: ONode | undefined, name: string) => ONode | undefined;
/** the child elements (with the name, when given) */
export declare const children: (n: ONode | undefined, name?: string) => ONode[];
/** every descendant element with the name (not looking inside a match) */
export declare function descendants(n: ONode | undefined, name: string, out?: ONode[]): ONode[];
/** the text of an element and its descendants (text:s, text:tab, text:line-break as the characters they stand for) */
export declare function textContent(n: ONode | string): string;
/** a length in points: "2.5cm", "12pt", "0.5in", "10mm", "1pc", "96px"; undefined for none or a percentage */
export declare function toPt(v: string | undefined): number | undefined;
/** "#rrggbb" → "RRGGBB" (OOXML); undefined for "transparent" or anything else */
export declare const toHex: (v: string | undefined) => string | undefined;
/** a style's property groups merged with those it inherits: group ("style:text-properties"…) → attribute → value */
export type StyleProps = Record<string, Record<string, string>>;
/**
 * The styles of a document: named styles (styles.xml office:styles), automatic styles (content.xml and styles.xml),
 * default styles per family, list styles, number (data) styles, page layouts and master pages.
 */
export declare class OdfStyles {
    /** `${family}/${name}` → style:style; automatic content styles override styles.xml ones of the same name */
    readonly styles: Map<string, ONode>;
    /** automatic styles of styles.xml only (used by master pages, headers and footers) */
    readonly masterAuto: Map<string, ONode>;
    readonly defaults: Map<string, ONode>;
    /** text:list-style by name */
    readonly lists: Map<string, ONode>;
    /** number:number-style, number:date-style, number:currency-style… by name */
    readonly dataStyles: Map<string, ONode>;
    /** style:page-layout by name */
    readonly pageLayouts: Map<string, ONode>;
    /** style:master-page by name, in document order */
    readonly masterPages: Map<string, ONode>;
    /** office:font-face-decls: font name → family ("Liberation Serif" → svg:font-family without quotes) */
    readonly fonts: Map<string, string>;
    constructor(stylesRoot: ONode | undefined, contentRoot: ONode | undefined);
    get(family: string, name: string | undefined): ONode | undefined;
    /** the inheritance chain of a style, the style itself first (parents after, default style last) */
    chain(family: string, name: string | undefined): ONode[];
    /** the properties of a style with what it inherits (parents, then the family's default style) */
    props(family: string, name: string | undefined): StyleProps;
    /** the font family a style:font-name refers to (the name itself when no font face declares it) */
    font(name: string | undefined): string | undefined;
}
/** An OpenDocument file: its content, styles, settings and other parts. */
export declare class OdfPackage {
    readonly content: ONode;
    readonly stylesRoot: ONode | undefined;
    readonly settings: ONode | undefined;
    readonly meta: ONode | undefined;
    private zip;
    private constructor();
    readonly styles: OdfStyles;
    /** Reads a package (ZIP) or a flat XML document (where content, styles, settings and meta are one document). */
    static open(src: ZipArchive | string): Promise<OdfPackage>;
    /** office:body's document element: office:text, office:spreadsheet or office:presentation */
    body(kind: 'text' | 'spreadsheet' | 'presentation'): ONode | undefined;
    /**
     * The bytes of a file an element points to (draw:image, draw:object…): `xlink:href` into the package, or
     * office:binary-data (flat XML). Undefined for external links and missing parts.
     */
    file(el: ONode): Promise<Uint8Array | undefined>;
    /** a config:config-item of settings.xml by name (the first found, for the first view) */
    setting(name: string): string | undefined;
}
