import type { DocumentClient } from '../../core/worker/client';
/**
 * An SVG file: the picture alone, no page around it, scaled down to fit the view and at its own size otherwise.
 * Drawn from the file's text (the Code pane edits it); the document built from it is what Download as Word gives.
 */
export declare function PictureView({ client }: {
    client: DocumentClient;
}): import("react").JSX.Element;
