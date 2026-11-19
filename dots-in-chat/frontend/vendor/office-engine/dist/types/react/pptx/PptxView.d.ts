import { type ReactNode } from 'react';
import type { PresentationMeta, SlideModel } from '../../core/pptx/types';
import type { DocumentClient } from '../../core/worker/client';
import { type Zoom } from '../common/ZoomControl';
import { type SlideEditing } from './Slide';
export declare function useSlide(client: DocumentClient, index: number): SlideModel | {
    error: string;
} | undefined;
export declare function SlideSlot(props: {
    client: DocumentClient;
    index: number;
    meta: PresentationMeta;
    scale: number;
    live: boolean;
    editing?: SlideEditing;
    overlay?: ReactNode;
}): import("react").JSX.Element;
export interface PptxViewProps {
    client: DocumentClient;
    onStatus?: (s: string) => void;
    initialZoom?: Zoom;
    thumbnails?: boolean;
}
export declare function PptxView({ client, onStatus, initialZoom, thumbnails }: PptxViewProps): import("react").JSX.Element;
