/**
 * The ShapeSheet of a Visio drawing: every shape, page, master and style is a sheet of named cells, some of them in
 * sections of rows (Geometry, Character, Paragraph…). A file stores only the cells that differ from what the sheet
 * inherits: a shape from its master's shape, then from its line, fill and text styles, which have parents of their
 * own. A stored value is the result (`V`), in inches and radians whatever unit it shows, so no formula is evaluated.
 */
import { type Attrs } from '../xml';
/** an element of a Visio part; inside `Text`, the text between the elements is kept in order as `#text` children */
export interface VNode {
    n: string;
    a: Attrs;
    c: VNode[];
    t: string;
}
export declare function parseVisioXml(xml: string): VNode;
export declare const vkid: (el: VNode | undefined, name: string) => VNode | undefined;
export declare const vkids: (el: VNode | undefined, name: string) => VNode[];
export interface Row {
    /** IX, or the name of a named row */
    key: string;
    ix: number;
    /** row type (LineTo, ArcTo…) */
    t?: string;
    del: boolean;
    cells: Map<string, string>;
}
export interface Section {
    name: string;
    ix: number;
    del: boolean;
    cells: Map<string, string>;
    rows: Map<string, Row>;
}
/** the cells and sections an element (Shape, PageSheet, StyleSheet) stores itself */
export declare class Sheet {
    readonly cells: Map<string, string>;
    /** by name; Geometry sections by `Geometry` + IX */
    readonly sections: Map<string, Section>;
    constructor(el?: VNode);
}
/** a style of the document: a sheet, and the styles its line, fill and text cells inherit from */
export interface Style {
    sheet: Sheet;
    line?: string;
    fill?: string;
    text?: string;
}
export type StyleKind = 'line' | 'fill' | 'text';
/** the styles of a document, and the chain each one inherits through */
export declare class Styles {
    private byId;
    add(id: string, el: VNode): void;
    /** the sheets of style `id` and its parents of one kind, nearest first */
    chain(id: string | undefined, kind: StyleKind): Sheet[];
}
/**
 * A shape as it is drawn: its own sheet, then its master's, then the styles. Cells and rows are looked up through
 * all of them; a row or section marked deleted hides what it inherits.
 */
export declare class Resolved {
    private chains;
    /** own sheets, nearest first: the shape's, its master shape's */
    readonly own: Sheet[];
    constructor(own: (Sheet | undefined)[], styles: Styles, ids: Record<StyleKind, string | undefined>);
    private sheetsFor;
    /** a cell's stored value */
    cell(name: string): string | undefined;
    /** a cell as a number; `def` when it is missing or not a number (a themed value, a name) */
    num(name: string, def?: number): number;
    /** a cell of a row: the shape's row, its master's, then the styles' (their row of that key, else their first) */
    rowCell(section: string, key: string, name: string): string | undefined;
    /** the keys of a section's rows the shape or its master has, in row order */
    rowKeys(section: string): string[];
    /** the Geometry sections, merged over the shape and its master, in order */
    geometry(): Geometry[];
}
export interface GeomRow {
    ix: number;
    t: string;
    cells: Map<string, string>;
}
export interface Geometry {
    ix: number;
    cells: Map<string, string>;
    rows: GeomRow[];
}
export declare function toNum(v: string | undefined, def?: number): number;
