import type { ByteSource } from '../source';
import { type SheetData } from './workbook';
export interface DelimitedImport {
    /** the text's bytes (a File, a buffer, a URL) */
    source: ByteSource;
    /** field separator: a tab, a semicolon or a comma; detected from the first line when missing */
    sep?: string;
    /** cells kept in memory at a time (RESIDENT_CELLS); past it the rows are read from the file as they are needed */
    budget?: number;
    /** rows read from the file at a time, past the budget (PAGE_ROWS) */
    pageRows?: number;
    /** the text's encoding (a `TextDecoder` label), instead of the byte order mark / declared charset / guess */
    encoding?: string;
    /** told when the file holds more than the sheet does (more columns than a sheet has): what is missing from the document */
    onWarning?: (text: string) => void;
}
/** what a loader reports while it fills a sheet */
export interface LoadReport {
    /** rows came in (the first call also means the header — column widths — is known); lets the view catch up */
    chunk(): Promise<void>;
    /** the rows reported so far were dropped and are being read again (another encoding): cached rows are stale */
    reset(): void;
    bytes?(loaded: number, total: number): void;
}
/** fills a sheet from something else than its XML (a text file being imported) */
export type SheetLoader = (d: SheetData, report: LoadReport) => Promise<void>;
/** cells a sheet holds in memory: a million rows of 12 columns (about 300 MB in Chrome, three times that in Safari) */
export declare const RESIDENT_CELLS = 12000000;
/** rows per page read from the file */
export declare const PAGE_ROWS = 1024;
/** where parsed rows go: the sheet, or a page of it */
export interface RowSink {
    rows: (unknown[] | undefined)[];
    maxRow: number;
    maxCol: number;
}
/** Streams a delimited text file into `d`; the rows are reported as they come. */
export declare function loadDelimited(d: SheetData, imp: DelimitedImport, report: LoadReport): Promise<void>;
/**
 * The rows of a sheet too large for memory, by pages: the pages in memory are in `d.rows` like any row, the others
 * are read from the file when `ensure`d, the least recently used ones leaving when the cells in memory pass the budget.
 * Pages with edits are pinned: they never leave (the file does not have their rows).
 */
export declare class RowPages {
    private d;
    /** rows per page */
    readonly size: number;
    /** cells to hold at most (pinned pages may exceed it) */
    readonly budget: number;
    /** byte offset of each page's first row; one more, the end, once the file is scanned */
    readonly starts: number[];
    private read;
    /** cells in memory, over the pages here */
    cells: number;
    /** all the rows are counted and every page can be read */
    complete: boolean;
    /** page → its cells, in order of use (the first is the least recently used) */
    private resident;
    private pinned;
    private loading;
    private readPages;
    private readCells;
    constructor(d: SheetData, 
    /** rows per page */
    size: number, 
    /** cells to hold at most (pinned pages may exceed it) */
    budget: number, 
    /** byte offset of each page's first row; one more, the end, once the file is scanned */
    starts: number[], read: (p: number) => Promise<(unknown[] | undefined)[]>);
    pageOf(r: number): number;
    /** the pages in memory */
    get count(): number;
    /** rows that can be read now: every row once the scan is done, else those of the pages the scan passed */
    get scanned(): number;
    finish(): void;
    /** row `r` is in memory (rows past the file's are: they are only ever edits) */
    has(r: number): boolean;
    /** the row's page never leaves memory (an edit went in) */
    pin(r: number): void;
    /** the first `n` pages, read while the file streamed in, are in memory */
    adopt(n: number): void;
    private countCells;
    /** what a page costs, from those read so far (else the sheet's width) */
    private perPage;
    /**
     * Rows [r0, r1] in memory (r1 clipped to what can be read), the least recently used other pages leaving once the
     * cells pass the budget. Throws when the rows cannot all be held.
     */
    ensure(r0: number, r1: number): Promise<void>;
    private load;
    private install;
    private touch;
    /** the least recently used pages outside [keep0, keep1] leave until the cells are within the budget */
    private evict;
    /** the rows of page `p` for a look (a search, the save) without keeping them: those in memory, else read */
    peek(p: number): Promise<(unknown[] | undefined)[]>;
}
