import type { DocumentClient } from '../../core/worker/client';
import type { Merge, WorkbookMeta } from '../../core/xlsx/types';
import type { Printable } from '../file/print';
import type { Axis } from './axis';
export interface SheetLayout {
    rows: number;
    cols: number;
    rowAxis: Axis;
    colAxis: Axis;
    merges: Merge[];
    gridLines: boolean;
    done: boolean;
}
/** The sheet as a table (used range, hidden rows / columns left out), fitted to the paper width. */
export declare function sheetPrintable(client: DocumentClient, sheet: number, l: SheetLayout, meta: WorkbookMeta): Promise<Printable>;
