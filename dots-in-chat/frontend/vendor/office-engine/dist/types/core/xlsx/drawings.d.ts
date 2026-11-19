/**
 * The pictures and charts on a sheet, read from its drawing part (`xl/drawings/drawingN.xml`, linked from the sheet's
 * rels), each with the place it is anchored to: two cell corners (`twoCellAnchor`), one corner and a size
 * (`oneCellAnchor`), or a position on the sheet and a size (`absoluteAnchor`). A picture carries its media part, which
 * the view shows where the browser can draw it (not EMF / WMF); a chart carries its kind and title, for a placeholder
 * the size of the chart. Shapes, text boxes and the like are left out, as are drawings in a group the anchor's own
 * frame does not hold.
 */
import { type OpcPackage } from '../opc';
/** A cell corner: 0-based column and row, and the offset into that cell in CSS pixels */
export interface DrawingCorner {
    c: number;
    r: number;
    dx: number;
    dy: number;
}
export interface SheetDrawing {
    kind: 'picture' | 'chart';
    from?: DrawingCorner;
    to?: DrawingCorner;
    /** position from the sheet's top left, px (absoluteAnchor) */
    at?: {
        x: number;
        y: number;
    };
    /** px (oneCellAnchor, absoluteAnchor) */
    size?: {
        w: number;
        h: number;
    };
    /** a picture's media part, where the browser can draw it */
    target?: string;
    /** a chart's title, or a picture's description */
    title: string;
    /** a chart's kind: 'column', 'bar', 'line', 'pie', … ('' where it is none the reader knows) */
    chart?: string;
}
/** The pictures and charts on the sheet at `sheetPath`, in the order they are drawn */
export declare function readSheetDrawings(pkg: OpcPackage, sheetPath: string): Promise<SheetDrawing[]>;
