import type { Block, Paragraph, Table, TableCell } from '../../core/docx/types';
export interface GridCell {
    ri: number;
    ci: number;
    g: number;
    cell: TableCell;
}
/** Grid positions of every cell (row spans occupy following rows). */
export declare function gridOf(t: Table): {
    cells: GridCell[];
    nCols: number;
    at: (ri: number, g: number) => GridCell | undefined;
};
export type NewPara = (template: TableCell) => Paragraph;
export declare function insertRow(t: Table, ri: number, below: boolean, mk: NewPara): Table;
export declare function deleteRow(t: Table, ri: number): Table | null;
export declare function insertCol(t: Table, g0: number, right: boolean, mk: NewPara): Table;
export declare function deleteCol(t: Table, g: number): Table | null;
/** New table model (rows × cols) with simple single borders. */
export declare function newTable(rowsN: number, colsN: number, width: number, mk: () => Paragraph): Table;
/** a cell of a table to build: what it holds and how many grid cells it covers */
export interface CellSeed {
    blocks: Block[];
    colSpan: number;
    rowSpan: number;
}
/**
 * A table from rows of cells as HTML has them (a cell with a row span is left out of the rows it covers; short rows are
 * filled up with empty cells), `width` pt wide, with the grid of a table the toolbar inserts.
 */
export declare function tableFromRows(seeds: CellSeed[][], width: number, mk: () => Paragraph): Table;
/** a rectangle of grid positions, inclusive */
export interface CellRect {
    r0: number;
    g0: number;
    r1: number;
    g1: number;
}
/** The rectangle spanned by two cells, grown until no merged cell sticks out of it. */
export declare function rectOf(t: Table, a: [number, number], b: [number, number]): CellRect | null;
/** cells whose top-left corner lies in the rectangle, in reading order */
export declare function cellsIn(t: Table, r: CellRect): GridCell[];
/** Merges every cell of the rectangle into its top-left one (contents kept, in reading order). Null: nothing to merge. */
export declare function mergeCells(t: Table, r: CellRect): Table | null;
/** Splits a merged cell back into single cells (the content stays in the top-left one). Null: the cell isn't merged. */
export declare function unmergeCell(t: Table, ri: number, ci: number, mk: NewPara): Table | null;
export type BorderPreset = 'all' | 'outer' | 'inner' | 'none' | 'top' | 'bottom' | 'left' | 'right';
/**
 * Sets the borders of the cells in the rectangle. `css`: the line drawn ('0.5pt solid #000000').
 * Lines on the edge of the rectangle are also set on the neighbouring cells, so both sides agree.
 */
export declare function setBorders(t: Table, r: CellRect, preset: BorderPreset, css: string): Table;
/** Gives every cell of the rectangle the change `patch` (shading, vertical alignment). */
export declare function patchCells(t: Table, r: CellRect, patch: (c: TableCell) => TableCell): Table;
/** Same total width, columns of the rectangle (or all) made equal. */
export declare function distributeCols(t: Table, r?: CellRect): Table;
