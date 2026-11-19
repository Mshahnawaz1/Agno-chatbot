import type { DocumentClient } from '../../core/worker/client';
export declare function DetailsDialog(props: {
    client: DocumentClient;
    file: [string, string][];
    stats: [string, string][];
    onClose: () => void;
}): import("react").JSX.Element;
