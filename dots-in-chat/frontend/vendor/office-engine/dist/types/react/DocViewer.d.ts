import { type CSSProperties, type ReactNode } from 'react';
import type { DocSource } from '../core/source';
import type { DocumentClient, OpenOptions } from '../core/worker/client';
import type { Zoom } from './common/ZoomControl';
import { type Icons } from './edit/Toolbar';
import { type FileMenuItem } from './file/FileMenu';
import { type Theme } from './theme';
import type { CollabOptions } from '../collab';
import { type CommentOptions } from './comments/Comments';
export interface DocViewerProps {
    /**
     * File, Blob, ArrayBuffer, Uint8Array or URL (HTTP Range requests are used when the server supports them): an Office file,
     * an Apple Pages / Keynote / Numbers file or a Microsoft Visio drawing (view only), CSV / TSV / text / Markdown / HTML (opened as a
     * workbook / document),
     * an SVG picture or a Mermaid / PlantUML / Graphviz diagram.
     */
    src: DocSource | null | undefined;
    /** Display name (defaults to File.name or the URL's last segment); its extension also tells the format of a source without one. */
    name?: string;
    className?: string;
    style?: CSSProperties;
    /** Show the top bar (name, status, progress). Default true. */
    toolbar?: boolean;
    /** Extra toolbar content (rendered at the right). */
    toolbarExtra?: ReactNode;
    /** Initial zoom for documents and presentations. Default 'fit'. */
    zoom?: Zoom;
    /** Show slide thumbnails for presentations. Default true. */
    thumbnails?: boolean;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
    /** Custom worker factory, or false to parse on the main thread. */
    worker?: OpenOptions['worker'];
    /** Where to inject the stylesheet (document or a shadow root). */
    styleTarget?: Document | ShadowRoot;
    /**
     * Inject the stylesheet. Default true. Set false when the page loads `@p10node/office-engine/styles.css` itself
     * (a CSP without inline styles, a cascade layer of its own, a bundler that extracts CSS).
     */
    injectStyles?: boolean;
    /**
     * Color scheme of the viewer chrome (bars, menus, dialogs): 'light', 'dark' or 'auto' (follows the OS / browser setting),
     * or a theme object with that mode and design token overrides (see docs/theming.md). The document itself keeps its own
     * colors. Default 'light'.
     */
    theme?: Theme;
    onLoad?: (client: DocumentClient) => void;
    onError?: (error: Error) => void;
    /** Start in edit mode. Default false (view). */
    editable?: boolean;
    /** Show the Edit/View toggle. Default true. */
    allowEdit?: boolean;
    /** Show the Save/Download button and enable Ctrl+S. Default true. */
    allowSave?: boolean;
    /**
     * Allow downloading files to the user's device (the save fallback without `onSave`, "Download image").
     * With `onSave`, saving still works when this is false. Default true.
     */
    allowDownload?: boolean;
    /** Show the File menu (new, open, save, rename, download as PDF / HTML / text…, details, print) and its shortcuts. Default true. */
    fileMenu?: boolean;
    /** File → New / Open: replace the document with a blank one or a local file (Office, Pages, Keynote, Numbers, Visio, CSV, text, Markdown, HTML). Default true. */
    allowOpen?: boolean;
    /** Extra File menu entries (Share, Version history…), shown before Close. */
    fileMenuItems?: FileMenuItem[];
    /** File → Rename: called with the new name (extension included). Rename is shown when `fileMenu` is on. */
    onRename?: (name: string) => void;
    /** Adds File → Close. */
    onClose?: () => void;
    /** Receives the saved file instead of downloading it. */
    onSave?: (file: Blob, name: string) => void | Promise<void>;
    /** Called when the document gets / loses unsaved changes. */
    onDirtyChange?: (dirty: boolean) => void;
    /**
     * Real-time collaboration: everyone opening the same base document (`src`) with the same `room`
     * edits it together through the hub at `transport` (see src/collab).
     */
    collab?: CollabOptions;
    /**
     * Ctrl/⌘+A anywhere on the page selects the document (text fields outside the viewer keep their own).
     * Default true. With false the shortcut works from the viewer only (its content or toolbar).
     */
    captureSelectAll?: boolean;
    /**
     * Comments (stored in the file, shared with collaborators): who writes them, who can be @mentioned, what the
     * host hears about. Shown by default, written while editing; `false` hides them.
     */
    comments?: CommentOptions | false;
    /**
     * The host's icons, shown instead of the built-in ones: a map by name (see `ICON_NAMES`) or a resolver
     * `(name, { size }) => node`; a missing entry, or `undefined` / `null` from the resolver, keeps the built-in icon.
     * Each is rendered in `span.de-icon`, sized by font-size (1em).
     */
    icons?: Icons;
}
export declare function DocViewer(props: DocViewerProps): import("react").JSX.Element;
