import type { DocumentClient } from '../../core/worker/client';
import { type Zoom } from '../common/ZoomControl';
export interface DocxViewProps {
    client: DocumentClient;
    onStatus?: (s: string) => void;
    initialZoom?: Zoom;
}
export declare function DocxView({ client, onStatus, initialZoom }: DocxViewProps): import("react").JSX.Element;
