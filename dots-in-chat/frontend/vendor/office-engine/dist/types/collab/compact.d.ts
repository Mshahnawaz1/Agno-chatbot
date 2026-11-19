/**
 * Server-side snapshots: replays shared history onto a document headlessly, exactly the way a
 * collaborator applies it, so the result can be saved as the room's new base file.
 *
 *   const client = await DocumentClient.open(snapshotFile, { worker: false })
 *   const snap = await compact(client, { from: snapshotMeta, batches })
 *   const file = await client.call('save')        // store it, then hub.snapshot(room, snap)
 */
import type { DocumentClient } from '../core/worker/client';
import type { Batch, Snapshot } from './protocol';
export interface CompactOptions {
    /** the snapshot `client` was opened from (default: the original upload, seq 0) */
    from?: Snapshot;
    /** batches to apply: every batch after `from.seq`, in order (older ones are ignored) */
    batches: Batch[];
    /** canonical batches kept as the new snapshot's context (default 1000) */
    window?: number;
}
/**
 * Applies `batches` to `client` (opened on the file of snapshot `from`) and returns the snapshot it
 * now holds. Save the document afterwards with `client.call('save')`.
 */
export declare function compact(client: DocumentClient, opts: CompactOptions): Promise<Snapshot>;
