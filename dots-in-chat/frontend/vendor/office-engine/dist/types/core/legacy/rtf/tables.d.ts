/** RTF table rows (`\trowd … \cellx … \row`) → w:tbl: a column grid from every row's cell boundaries, merges, borders, shading. */
import { type Border, type Shade, type Side, type Tables } from './props';
export interface Pad {
    t?: number;
    l?: number;
    b?: number;
    r?: number;
}
export interface CellDef {
    /** right boundary (twips from the left margin) */
    x: number;
    mgf?: boolean;
    mrg?: boolean;
    vmgf?: boolean;
    vmrg?: boolean;
    va?: 'top' | 'center' | 'bottom';
    brdr: Partial<Record<Side, Border>>;
    shd?: Shade;
    pad: Pad;
    noWrap?: boolean;
    dir?: string;
}
export interface RowDef {
    /** half the space between cells: the cells' left / right padding */
    gaph?: number;
    /** left edge of the row */
    left: number;
    /** height: > 0 at least, < 0 exactly */
    rh?: number;
    hdr?: boolean;
    keep?: boolean;
    jc?: 'center' | 'right';
    brdr: Partial<Record<Side, Border>>;
    pad: Pad;
    cells: CellDef[];
    auto?: boolean;
}
export declare const newRow: () => RowDef;
export declare const newCell: () => CellDef;
/** a table being read (one per nesting level) */
export declare class TableLevel {
    rows: {
        def: RowDef;
        cells: string[];
    }[];
    /** finished cells of the current row */
    cells: string[];
    /** blocks of the current cell */
    cur: string[];
    /** the last row definition seen (rows without one of their own repeat it) */
    def?: RowDef;
}
/** The table's XML ('' when it has no cells). Cells and rows still open are closed. */
export declare function tableXml(t: Tables, lvl: TableLevel): string;
