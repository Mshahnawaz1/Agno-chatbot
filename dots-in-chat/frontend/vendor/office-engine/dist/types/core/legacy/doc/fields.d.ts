/** Fields of a Word binary document: their instructions, HYPERLINK targets, form field values; revision dates. */
import type { Bytes } from './bin';
export interface FieldInfo {
    sep: number;
    end: number;
    instr: string;
    /** fields inside the instruction */
    nested: boolean;
}
export interface Frame {
    begin: number;
    mode: 'link' | 'complex' | 'drop';
    phase: 'instr' | 'result';
    link?: string;
    /** the instruction was written whole at the start: its characters are skipped */
    skip?: boolean;
    /** a form field's data (FFData offset in the Data stream) */
    form?: number;
    instr?: string;
}
/** field types (flt) → field names, for files that store localized names */
export declare const FLT: Record<number, string>;
export declare const FIELD_NAMES: Set<string>;
/** a form field's shown value: a check box's glyph, a drop-down's chosen entry (FFData in the Data stream) */
export declare function formValue(data: Bytes | undefined, fc: number): string | undefined;
/** DTTM (packed minutes / hours / day / month / year) → ISO date */
export declare function dttm(v: number): string | undefined;
/** HYPERLINK instruction → target URL and / or bookmark */
export declare function hyperlink(instr: string): {
    url?: string;
    anchor?: string;
    tip?: string;
} | undefined;
