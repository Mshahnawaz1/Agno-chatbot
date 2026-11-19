export declare class Unsupported extends Error {
}
export interface FormulaEnv {
    biff: 5 | 8;
    /** BIFF8: the sheet prefix ("Sheet1!", "'A b'!", "S1:S3!") of an EXTERNSHEET entry, '' for the workbook, null for a deleted sheet */
    sheetRef(ixti: number): string | null;
    /** BIFF5: the sheet prefix of a 3D reference (own workbook when ixals < 0) */
    sheetRef5(ixals: number, first: number, last: number): string | null;
    /** a defined name by its 1-based index, seen from sheet `sheet` */
    name(index: number, sheet: number): string;
    /** BIFF8: an external (add-in) name */
    nameX(ixti: number, index: number): string;
    /** 8-bit text in the workbook's code page (BIFF5) */
    text8(b: Uint8Array): string;
}
/** a sheet name as a formula writes it: quoted when it is not a plain name */
export declare function quoteSheet(name: string): string;
/** a number as formula text */
export declare function numText(v: number): string;
/**
 * The text of a formula. `r`, `c`: the cell it is in (the base of relative references in shared formulas and names);
 * `rel`: 3D references are relative to it too (shared formulas, names). `sheet`: the formula's sheet (-1 for global names).
 */
export declare function formulaText(env: FormulaEnv, rgce: Uint8Array, extra: Uint8Array | undefined, r: number, c: number, rel: boolean, sheet: number): string;
