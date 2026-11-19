export interface FnInfo {
    name: string;
    args: string[];
    /** last argument repeats (`...`) */
    variadic: boolean;
    desc: string;
}
/** All functions offered to the user, sorted by name. */
export declare function functionCatalog(): FnInfo[];
export declare function functionInfo(name: string): FnInfo | undefined;
/** Functions whose name starts with `prefix` (case-insensitive). */
export declare function suggestFunctions(prefix: string, limit?: number): FnInfo[];
/** Index of the signature argument to highlight for the `arg`-th (0-based) argument being typed. */
export declare function argSlot(f: FnInfo, arg: number): number;
