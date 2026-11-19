import type { PageSet, PageSetup } from '../../core/docx/types';
/** paper sizes in pt (portrait) */
export declare const PAPERS: {
    k: string;
    label: string;
    w: number;
    h: number;
}[];
/** the paper of a page (either way round), or 'custom' */
export declare function paperOf(page: {
    w: number;
    h: number;
}): string;
/**
 * Page setup for the whole document: paper, orientation, margins (cm), text columns.
 * `onOk` gets only what changed.
 */
export declare function PageSetupDialog({ page, onOk, onClose }: {
    page: PageSetup;
    onOk: (set: PageSet) => void;
    onClose: () => void;
}): import("react").JSX.Element;
