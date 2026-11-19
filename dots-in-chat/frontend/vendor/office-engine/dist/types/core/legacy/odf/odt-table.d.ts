/** OpenDocument tables in text (table:table) → WordprocessingML tables: column grid, spans, borders, shading, padding. */
import { type ONode } from './common';
/** what the table converter needs from the document converter */
export interface TableHost {
    /** an element's property group (e.g. 'style:table-cell-properties') of a style, with what the style inherits */
    props(family: string, name: string | undefined, group: string): Record<string, string>;
    /** the blocks of a cell (ending with a paragraph); `pbb`: its first paragraph starts a page */
    cellBlocks(cell: ONode, width: number, pbb: boolean): string;
}
/** Converts a table to w:tbl; `avail` is the width (points) between the margins (or of the cell around it). */
export declare function tableXml(host: TableHost, t: ONode, avail: number, pbb?: boolean): string;
