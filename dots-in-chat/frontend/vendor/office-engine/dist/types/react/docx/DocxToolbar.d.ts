import { type CSSProperties } from 'react';
import type { CanonStyle, StyleInfo } from '../../core/docx/types';
import type { DocxEditor } from './DocxEditor';
/** cell border lines: value is the CSS width + style */
export declare const CELL_LINES: {
    value: string;
    label: string;
    hint: string;
}[];
/** the paragraph styles offered: the built-in ones first (in the document or not: `@kind` then), then the document's other quick styles */
export declare function styleChoices(styles: StyleInfo[]): {
    value: string;
    label: string;
    k?: CanonStyle;
    s?: StyleInfo;
    look?: CSSProperties;
    sep: boolean;
}[];
export interface ImageActions {
    original: () => void;
    replace: () => void;
    alt: () => void;
    /** undefined when downloads are disabled */
    download?: () => void;
}
export declare function DocxToolbar(props: {
    editor: DocxEditor;
    styles: StyleInfo[];
    onFind: () => void;
    outline: boolean;
    onOutline: () => void;
    painter: boolean;
    onLink: () => void;
    image: ImageActions;
    /** opens the page setup dialog */
    onPageSetup?: () => void;
    /** opens the header / footer dialog */
    onHeaderFooter?: () => void;
    /** a short message for the user (toast) */
    onNotice?: (text: string) => void;
}): import("react").JSX.Element;
