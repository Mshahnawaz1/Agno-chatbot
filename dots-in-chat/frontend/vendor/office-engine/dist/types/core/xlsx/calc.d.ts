import { type XlsxWorkbook } from './workbook';
export declare class Calc {
    private wb;
    private asts;
    private cellDeps;
    /** by sheet read */
    private rangeDeps;
    private registered;
    /** ranges no formula reads any more, still listed (dropped when they are many) */
    private idle;
    /**
     * Formulas computed anew at every change: what they read is only known when they run (INDIRECT, OFFSET), or what
     * they give changes by itself (NOW, RAND). As in Excel.
     */
    private volatile;
    /** the cells an array formula fills (other than its own) → the formula's cell: reading one waits for the formula */
    private filledBy;
    private names;
    /** blocks of cells kept while a pass computes (`block`), those asked for once, and the cells they hold in all */
    private kept;
    private asked;
    private keptCells;
    /** a clock of the values stored in this pass, and when one was last stored in a column (sheet * MAX_COL + column) */
    private clock;
    private stored;
    private indexed;
    /** whether the cells computed now are noted as changed (`SheetData.revalued`): not those computed when a file is read */
    private track;
    private depth;
    constructor(wb: XlsxWorkbook);
    /** the sheets changed (one loaded, added, moved, renamed, deleted) or formulas did under the index: it is built anew */
    invalidate(): void;
    /** the cells the array formula at (sheet, key) fills, when it is one */
    private arrayAt;
    private sheetIndex;
    private ast;
    private index;
    private addDeps;
    /** a formula was added / changed / removed at (sheet, key) */
    formulaChanged(sheet: number, key: number): void;
    /** drops the ranges no formula reads any more, once they are many (formulas changed over and over, each with its own range) */
    private sweep;
    /** the value of a cell entry (its type and what it holds) as the formula engine sees it */
    private entryValue;
    /** current value of a cell as the formula engine sees it */
    private value;
    /**
     * The cells of a block, as `provider.value` gives them one by one, without what that costs per cell (an id made
     * for each, the row searched from its start): a sum down a column of 10 000 rows, in each of 10 000 rows, is fifty
     * million of them. Only the cells holding a formula go the long way (they may be still to compute, or part of a
     * circular reference). Returns whether a cell was one being computed (read as #REF!, for now only).
     */
    private read;
    /** see `CellProvider.block`: kept from the second time a block is asked for, while nothing is stored in its columns */
    private block;
    /** a value was stored in column `c` of `sheet`: the blocks kept over it are stale */
    private touched;
    private forget;
    private provider;
    private cur;
    private compute;
    /**
     * Computes `start` and what it reads. Formulas nested too deep are computed from the innermost out: `stack` holds
     * the ones given up for now, each read (through others) by the one under it. So what the top one reads is never
     * one of those below, unless the reference is circular: they are `visiting` meanwhile, and read as such.
     */
    private settle;
    /**
     * The rows that computing the formulas a change touches would read: the formulas given (added: their text, not yet
     * in the sheet) and those depending on the changed cells. For sheets read from their file by pages, to have those
     * rows in memory first.
     */
    reads(changed: {
        sheet: number;
        key: number;
    }[], added: {
        sheet: number;
        key: number;
        text: string;
    }[]): {
        sheet: number;
        r0: number;
        r1: number;
    }[];
    /** the formula cells to compute after `changed` cells change: the given ones, then every dependent (transitively) */
    private affected;
    /**
     * Evaluates the given formula cells and everything that depends on the changed cells. `track`: the cells whose
     * value changes are noted for the next save (not when the values are those a file left out).
     */
    recalc(changed: {
        sheet: number;
        key: number;
    }[], formulas?: {
        sheet: number;
        key: number;
    }[], track?: boolean, volatile?: boolean): Set<number>;
    /**
     * Formulas whose value is missing or not to be trusted (files written without cached values); `clock`: and those
     * whose value is of the moment (TODAY, NOW, RAND…), with what reads them. Returns the sheets computed in.
     */
    computeMissing(cells: {
        sheet: number;
        key: number;
    }[], clock?: boolean): Set<number>;
}
