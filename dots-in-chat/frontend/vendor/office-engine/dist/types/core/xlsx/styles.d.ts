import type { Theme } from '../theme';
import { type XEl } from '../xml';
import type { CellCss } from './types';
export interface XfInfo {
    numFmt: string;
    /** font size in pt */
    fontPt: number;
    css: CellCss;
    /** explicit horizontal alignment */
    hAlign?: string;
    wrap: boolean;
    /** the cell is locked (the default): what a protected sheet refuses to change */
    locked: boolean;
}
export interface SheetStyles {
    xfs: XfInfo[];
    baseFont: CellCss;
}
export declare function parseSheetStyles(root: XEl | undefined, theme: Theme): SheetStyles;
