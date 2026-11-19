/**
 * BIFF records ([MS-XLS]): the record ids read, a reader over a record and its CONTINUE records, the string forms of
 * BIFF8 (16-bit or "compressed" 8-bit characters) and BIFF5 (8-bit characters in the workbook's code page).
 */
/** record ids */
export declare const R: {
    readonly FORMULA: 6;
    readonly EOF: 10;
    readonly HEADER: 20;
    readonly FOOTER: 21;
    readonly EXTERNSHEET: 23;
    readonly NAME: 24;
    readonly VERTICALPAGEBREAKS: 26;
    readonly HORIZONTALPAGEBREAKS: 27;
    readonly NOTE: 28;
    readonly DATEMODE: 34;
    readonly EXTERNNAME: 35;
    readonly LEFTMARGIN: 38;
    readonly RIGHTMARGIN: 39;
    readonly TOPMARGIN: 40;
    readonly BOTTOMMARGIN: 41;
    readonly PRINTHEADERS: 42;
    readonly PRINTGRIDLINES: 43;
    readonly FILEPASS: 47;
    readonly FONT: 49;
    readonly CONTINUE: 60;
    readonly WINDOW1: 61;
    readonly PANE: 65;
    readonly CODEPAGE: 66;
    readonly DEFCOLWIDTH: 85;
    readonly OBJ: 93;
    readonly PROTECT: 18;
    readonly PASSWORD: 19;
    readonly COLINFO: 125;
    readonly WSBOOL: 129;
    readonly HCENTER: 131;
    readonly VCENTER: 132;
    readonly BOUNDSHEET: 133;
    readonly PALETTE: 146;
    readonly AUTOFILTERINFO: 157;
    readonly STANDARDWIDTH: 153;
    readonly SCL: 160;
    readonly SETUP: 161;
    readonly MULRK: 189;
    readonly MULBLANK: 190;
    readonly RSTRING: 214;
    readonly XF: 224;
    readonly MERGECELLS: 229;
    readonly SST: 252;
    readonly LABELSST: 253;
    readonly SUPBOOK: 430;
    readonly TXO: 438;
    readonly HLINK: 440;
    readonly BLANK: 513;
    readonly NUMBER: 515;
    readonly LABEL: 516;
    readonly BOOLERR: 517;
    readonly STRING: 519;
    readonly ROW: 520;
    readonly ARRAY: 545;
    readonly DEFAULTROWHEIGHT: 549;
    readonly WINDOW2: 574;
    readonly RK: 638;
    readonly STYLE: 659;
    readonly FORMAT: 1054;
    readonly SHRFMLA: 1212;
    readonly HLINKTOOLTIP: 2048;
    readonly BOF: 2057;
    readonly SHEETEXT: 2146;
    readonly XFEXT: 2173;
    readonly CONTINUEFRT12: 2175;
    readonly THEME: 2198;
};
/** BIFF error codes → their text */
export declare const ERRORS: Record<number, string>;
/** the value of an RK number (a 30-bit integer or the high bits of a double, optionally ×100) */
export declare function rkValue(rk: number): number;
/** a decoder of 8-bit text in a Windows code page (BIFF5 strings); Latin-1 when the code page is unknown */
export declare function codepageDecoder(cp: number): (b: Uint8Array) => string;
/** 8-bit characters as their code points (BIFF8 "compressed" strings: the low bytes of UTF-16) */
export declare function latin1(b: Uint8Array, start?: number, n?: number): string;
/** 16-bit characters (little-endian) */
export declare function utf16(b: Uint8Array, start: number, n: number): string;
/** a string of a BIFF8 record (no CONTINUE): `cch` characters at `at` after a flag byte, 16-bit when its bit 0 is set */
export declare function str8At(b: Uint8Array, at: number, cch: number): {
    text: string;
    end: number;
};
/**
 * A record's data and the CONTINUE records after it, read as one: numbers and raw bytes run on into the next part,
 * while the characters of a BIFF8 string start each part with a new flag byte (8-bit or 16-bit).
 */
export declare class Parts {
    private parts;
    private k;
    private pos;
    private cur;
    constructor(parts: Uint8Array[]);
    /** nothing left to read */
    get eof(): boolean;
    /** at the end of the current part */
    get atPartEnd(): boolean;
    private next;
    u8(): number;
    u16(): number;
    u32(): number;
    f64(): number;
    skip(n: number): void;
    bytes(n: number): Uint8Array;
    /** `n` characters, 16-bit when `high`: a part boundary in between starts with a flag byte giving the new width */
    chars(n: number, high: boolean): string;
    /**
     * A BIFF8 string with its header (`lenBytes`: 1 or 2 bytes of length) and the rich-text runs ([character, font]) and
     * phonetic data after it (skipped).
     */
    str(lenBytes: 1 | 2): {
        text: string;
        runs?: number[];
    };
}
