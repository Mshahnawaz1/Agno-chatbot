import type { Inline, Paragraph, ParaSpec, SpecRun, Table, TableSpec } from './types';
export declare function inlineSpec(x: Inline): SpecRun;
/** Write-back spec for a paragraph (all page-break parts sharing one pid). */
export declare function paraSpec(parts: Paragraph[]): ParaSpec;
/** Write-back spec for a table regenerated from the editor model (`t.tid` set). */
export declare function tableSpec(t: Table): TableSpec;
