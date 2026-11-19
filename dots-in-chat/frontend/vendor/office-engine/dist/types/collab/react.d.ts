import type { DocumentClient } from '../core/worker/client';
import { type Collab, type CollabOptions } from './index';
import type { CollabStatus } from './session';
export interface CollabState {
    collab: Collab | null;
    status: CollabStatus | null;
    error?: string;
}
/** runs a collaboration session for `client` while `opts` is set */
export declare function useCollab(client: DocumentClient | null | undefined, opts: CollabOptions | undefined): CollabState;
/** status chip + collaborators' avatars (top bar) */
export declare function CollabBar({ client, state }: {
    client: DocumentClient;
    state: CollabState;
}): import("react").JSX.Element | null;
/**
 * Collaborators' cursors drawn over the document (DOCX carets / selections, PPTX selected shapes).
 * Spreadsheets draw their own (in-grid) selection boxes. Render inside a positioned container.
 */
export declare function PeerOverlay({ client, collab }: {
    client: DocumentClient;
    collab: Collab | null;
}): import("react").JSX.Element;
