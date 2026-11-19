/** Variable-size axis (rows or columns): default size + sparse overrides, O(log n) lookups. */
export declare class Axis {
    def: number;
    count: number;
    private custom;
    private keys;
    private cum;
    private dirty;
    constructor(def: number);
    set(i: number, size: number): void;
    setRange(min: number, max: number, size: number): void;
    private build;
    size(i: number): number;
    /** Start offset of index i. */
    pos(i: number): number;
    total(): number;
    /** Index containing offset px (clamped to [0, count-1]). */
    index(px: number): number;
}
