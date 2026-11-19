import { type XEl } from './xml';
export interface Theme {
    colors: Record<string, string>;
    major: string;
    minor: string;
    fillStyles: XEl[];
    bgFillStyles: XEl[];
    lineStyles: XEl[];
}
export declare const DEFAULT_THEME: Theme;
export declare function parseTheme(root: XEl | undefined): Theme;
