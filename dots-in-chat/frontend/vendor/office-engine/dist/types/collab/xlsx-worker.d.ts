/**
 * Worker side of XLSX collaboration: runs operations on the XlsxEditor without its undo
 * history, keeping one exact record per applied operation (for rebasing and shared undo).
 */
import type { XlsxEditor } from '../core/xlsx/editor';
import type { SheetProgress, XlsxEditResult } from '../core/xlsx/types';
import type { XlsxWorkbook } from '../core/xlsx/workbook';
import { type XOp } from './xlsx-ops';
export declare class XlsxCollabWorker {
    private ed;
    private wb;
    private emit;
    private recs;
    /** op id → record of its latest application */
    private byOp;
    private seq;
    constructor(ed: XlsxEditor, wb: XlsxWorkbook, emit: (p: SheetProgress) => void);
    private index;
    private sheet;
    /** forgets the records of a sheet (null: all), whose cell keys / indexes changed under them */
    private dropSheet;
    apply(op: XOp): Promise<{
        res: XlsxEditResult | null;
        rec: number | null;
    }>;
    private run;
    /** exactly undoes an applied operation (rebase) */
    revert(id: number): Promise<XlsxEditResult | null>;
}
