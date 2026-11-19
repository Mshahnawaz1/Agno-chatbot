import type { DocSource } from '../core/source';
import { DocumentClient, type OpenOptions } from '../core/worker/client';
import type { Events } from '../core/worker/protocol';
export interface DocumentState {
    client: DocumentClient | null;
    error: Error | null;
    loading: boolean;
    progress: Events['progress'] | null;
}
/**
 * Opens a document in a worker and closes it on unmount / source change.
 * `keep`: on a source change, the document shown stays (and usable) until the next one is open — the live preview
 * of an edited source.
 */
export declare function useDocument(src: DocSource | null | undefined, options?: OpenOptions, keep?: boolean): DocumentState;
