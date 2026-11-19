import type { FmtPatch } from '../../core/xlsx/types';
export type MergeMode = 'all' | 'across' | 'down' | 'unmerge';
export declare function XlsxToolbar(props: {
    css: Record<string, string | number>;
    /** workbook default font (cells without an explicit font) */
    base: {
        fontFamily?: string;
        fontSize?: string | number;
    };
    format: string;
    merged: boolean;
    frozen: boolean;
    gridlines: boolean;
    painter: boolean;
    onToggle: (k: 'b' | 'i' | 'u' | 'strike') => void;
    onFormat: (p: FmtPatch) => void;
    onUndo: () => void;
    onRedo: () => void;
    onPaint: () => void;
    onMerge: (mode: MergeMode) => void;
    onFreeze: (k: 'none' | 'row' | 'col' | 'sel') => void;
    onGridlines: () => void;
    onFunc: (fn: string | null) => void;
    onSort: (desc: boolean) => void;
    onRows: (k: 'rowAbove' | 'rowBelow' | 'colLeft' | 'colRight' | 'delRow' | 'delCol' | 'hideRows' | 'hideCols' | 'unhideRows' | 'unhideCols') => void;
    onFind: () => void;
}): import("react").JSX.Element;
