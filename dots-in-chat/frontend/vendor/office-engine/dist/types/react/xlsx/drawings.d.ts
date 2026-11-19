import { type CSSProperties, type ReactNode } from 'react';
import type { DocumentClient } from '../../core/worker/client';
import type { SheetDrawing } from '../../core/xlsx/drawings';
import type { Axis } from './axis';
/** a sheet's drawing with its picture's object URL, where the browser can draw it */
export interface ShownDrawing extends SheetDrawing {
    url?: string;
}
/** The pictures and charts of the sheet (`xlsx.drawings`), read again when another sheet is shown */
export declare function useSheetDrawings(client: DocumentClient, sheet: number): ShownDrawing[];
/**
 * Where a drawing lies on the sheet, px from its top left: anchored to cells it moves and grows with their rows and
 * columns (a hidden one is 0 wide); given by a size it keeps that size.
 */
export declare function drawingBox(d: SheetDrawing, cols: Axis, rows: Axis): {
    x: number;
    y: number;
    w: number;
    h: number;
} | null;
/** How many rows and columns the sheet needs to reach every drawing (a drawing given by a size taken over default-sized cells) */
export declare function drawingExtent(list: SheetDrawing[], cols: Axis, rows: Axis): {
    rows: number;
    cols: number;
};
/** A drawing as shown: the picture itself, or a box of its size saying what is there (a chart, a picture the browser cannot draw) */
export declare function drawingEl(key: string, d: ShownDrawing, style: CSSProperties): ReactNode;
