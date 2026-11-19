/**
 * Schema-less protobuf reader: iWork archives are protobuf messages whose .proto files Apple does not publish,
 * so fields are read by number (see the reverse-engineered schemas cited in iwork/README notes).
 */
export declare class Msg {
    readonly buf: Uint8Array;
    /** field number, wire type and value of each occurrence, in order (indexed after a few lookups) */
    private nums?;
    private wts?;
    private vals?;
    /** lookups answered by scanning (small messages read once need no index) */
    private scans;
    constructor(buf: Uint8Array);
    private index;
    /** last occurrence of a field, found by scanning: [wire type, value], or undefined */
    private scan;
    /** position of the last occurrence of a field (-1: absent) */
    private at;
    private all;
    has(f: number): boolean;
    /** field numbers present (for debugging) */
    keys(): number[];
    private last;
    private wire;
    /** varint (uint32 / uint64 / int32 / enum / bool); fixed32 read as an unsigned number */
    u(f: number): number | undefined;
    bool(f: number): boolean | undefined;
    float(f: number): number | undefined;
    double(f: number): number | undefined;
    bytes(f: number): Uint8Array | undefined;
    str(f: number): string | undefined;
    strs(f: number): string[];
    msg(f: number): Msg | undefined;
    msgs(f: number): Msg[];
    /** repeated varints, packed or not */
    us(f: number): number[];
    /** repeated floats (packed or not) */
    floats(f: number): number[];
    /** TSP.Reference field: the identifier of the object it points to */
    ref(f: number): number | undefined;
    refs(f: number): number[];
}
