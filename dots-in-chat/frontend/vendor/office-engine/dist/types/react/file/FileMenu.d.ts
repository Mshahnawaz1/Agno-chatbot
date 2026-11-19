import type { DocKind } from '../../core/opc';
import type { FileOps } from '../common/Slots';
import { type DropOption, type IconName } from '../edit/Toolbar';
export declare const KIND_LABEL: Record<DocKind, string>;
/** Host-provided File menu entry (Share, Version history…). */
export interface FileMenuItem {
    label: string;
    /** built-in icon name */
    icon?: IconName;
    /** shortcut / note on the right */
    hint?: string;
    disabled?: boolean;
    onClick: () => void;
}
export interface FileActionsOptions {
    kind: DocKind | undefined;
    /** extension of the Office file when it is not the plain one of its kind (".xlsm", ".dotx"…) */
    ext?: string;
    /** file name without extension */
    base: string;
    /** New / Open (replace the document) */
    canOpen: boolean;
    /** Import into the document (spreadsheets) */
    canImport: boolean;
    canSave: boolean;
    canDownload: boolean;
    ops: {
        current: FileOps | null;
    };
    create: (kind: DocKind) => void;
    open: (file: File) => void;
    save: () => Promise<void>;
    /** the document in its own format */
    downloadOriginal: () => Promise<void>;
    /** a picture file (SVG): downloads are the Word document, PDF and the picture itself */
    picture?: {
        label: string;
        ext: string;
        download: () => Promise<void>;
    };
    rename?: () => void;
    details?: () => void;
    close?: () => void;
    extra: FileMenuItem[];
    notify: (message: string) => void;
}
export interface FileActions {
    options: DropOption<string>[];
    busy: boolean;
    run: (action: string) => void;
}
/** File menu entries and their actions (also used by the Ctrl+O / Ctrl+P shortcuts). */
export declare function useFileActions(o: FileActionsOptions): FileActions;
export declare function FileMenu({ actions }: {
    actions: FileActions;
}): import("react").JSX.Element | null;
