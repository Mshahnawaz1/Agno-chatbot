import type { PresentationMeta } from '../../core/pptx/types';
import type { DocumentClient } from '../../core/worker/client';
/** Full-screen slideshow: ←/→/Space/PageUp/PageDown/Home/End, click = next, Esc = exit. */
export declare function Presenter({ client, meta, start, onClose }: {
    client: DocumentClient;
    meta: PresentationMeta;
    start: number;
    onClose: () => void;
}): import("react").JSX.Element;
