import { type ReactNode } from 'react';
import type { SlideModel, TextBody } from '../../core/pptx/types';
import type { DocumentClient } from '../../core/worker/client';
export interface TextEdit {
    /** contentEditable root callback */
    root: (el: HTMLDivElement | null) => void;
}
export declare function TextView({ text, flow, edit }: {
    text: TextBody;
    flow?: boolean;
    edit?: TextEdit;
}): import("react").JSX.Element;
export interface SlideEditing {
    sid: number;
    /** [row, column]: the text is a cell's of table `sid` */
    cell?: [number, number];
    text: TextBody;
    edit: TextEdit;
}
export interface SlideViewProps {
    model: SlideModel;
    client: DocumentClient;
    scale: number;
    /** load media (false for far-away thumbnails) */
    live?: boolean;
    editing?: SlideEditing;
    /** extra layer drawn in slide coordinates (selection handles) */
    overlay?: ReactNode;
}
export declare const SlideView: import("react").MemoExoticComponent<({ model, client, scale, live, editing, overlay }: SlideViewProps) => import("react").JSX.Element>;
