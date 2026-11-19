/** Parsed A1 reference as written in a formula (0-based, inclusive, normalized r0<=r1, c0<=c1). */
export interface RefAddr {
    sheet?: string;
    kind: 'cell' | 'area' | 'cols' | 'rows';
    r0: number;
    c0: number;
    r1: number;
    c1: number;
    ar0: boolean;
    ac0: boolean;
    ar1: boolean;
    ac1: boolean;
}
export declare function colName(c: number): string;
export declare function colIndex(letters: string): number;
export declare function sameSheet(a: string | undefined, b: string | undefined): boolean;
/** Sheet name as it must appear before '!' (quoted when needed). */
export declare function quoteSheet(name: string): string;
/** Reference text. `sheetText` (raw prefix without '!') is reused when given to preserve original quoting. */
export declare function fmtRef(a: RefAddr, sheetText?: string): string;
/** Swap ends (with their $ flags) so r0<=r1 and c0<=c1. Mutates. */
export declare function normalizeRef(a: RefAddr): RefAddr;
export declare function refInBounds(a: RefAddr, maxRow?: number): boolean;
