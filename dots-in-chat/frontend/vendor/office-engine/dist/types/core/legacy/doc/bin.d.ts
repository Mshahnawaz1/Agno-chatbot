/** Bounds-checked little-endian reads for the Word binary structures: a read past the end gives 0, never throws. */
export declare class Bytes {
    readonly b: Uint8Array;
    readonly dv: DataView;
    constructor(b: Uint8Array);
    get length(): number;
    u8(o: number): number;
    u16(o: number): number;
    i16(o: number): number;
    u32(o: number): number;
    i32(o: number): number;
    /** `n` bytes at `o`, cut to what the array holds */
    sub(o: number, n: number): Uint8Array;
    /** UTF-16LE text of `n` characters at `o` */
    utf16(o: number, n: number): string;
}
export declare const utf16: (b: Uint8Array) => string;
export declare const cp1252: (b: Uint8Array) => string;
/** A PLC: n + 1 character positions and n data elements of `cb` bytes. */
export declare class Plc {
    readonly b: Bytes;
    readonly cb: number;
    readonly cps: number[];
    readonly n: number;
    private dataAt;
    constructor(b: Bytes, fc: number, lcb: number, cb: number);
    /** offset of data element i */
    at(i: number): number;
    /** index of the element whose start CP is `cp` (-1 when none) */
    find(cp: number): number;
}
/** A string table (STTB): its strings and the extra data of each. */
export declare function sttb(b: Bytes, fc: number, lcb: number): {
    strs: string[];
    extra: number[];
};
/** Last index i with arr[i] <= v (-1 when v is before the first). */
export declare function lastLE(arr: ArrayLike<number>, v: number): number;
