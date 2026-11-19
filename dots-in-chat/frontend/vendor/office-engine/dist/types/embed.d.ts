import './core/default-worker';
import { DocViewer, type DocViewerProps } from './react/DocViewer';
import type { Icons } from './react/edit/Toolbar';
export type MountOptions = Omit<DocViewerProps, 'styleTarget'>;
export interface MountedViewer {
    update(next: Partial<MountOptions>): void;
    destroy(): void;
}
/** Framework-free embedding: renders the viewer into `el`. */
export declare function mount(el: HTMLElement, options: MountOptions): MountedViewer;
/**
 * `<office-viewer src="/file.xlsx" style="height:600px"></office-viewer>`
 * Rendered inside a shadow root so host page CSS cannot leak in.
 * Attributes: src, name, editable, toolbar / thumbnails / save / download / file-menu / open / capture-select-all ("false" to turn off),
 * theme ("light" | "dark" | "auto");
 * real-time collaboration: collab (hub WebSocket URL), room, user (display name), base (snapshot seq `src` was opened at).
 * Properties: `file` (File/Blob/ArrayBuffer) for local data; `icons` (map or resolver, as DocViewer's `icons`).
 */
export declare class OfficeViewerElement extends HTMLElement {
    static observedAttributes: string[];
    private viewer?;
    private _file?;
    private _icons?;
    private readonly onLoad;
    private readonly onError;
    private readonly onComment;
    get file(): Blob | ArrayBuffer | undefined;
    set file(v: Blob | ArrayBuffer | undefined);
    get icons(): Icons | undefined;
    set icons(v: Icons | undefined);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(): void;
    private props;
    private sync;
}
export declare function defineElement(tag?: string): void;
export { DocViewer };
