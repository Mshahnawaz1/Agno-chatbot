import { type CSSProperties } from 'react';
import type { Block, RunStyle } from '../../core/docx/types';
import type { DocumentClient } from '../../core/worker/client';
export interface RenderCtx {
    client: DocumentClient;
    /** 0-based page index, -1 while measuring */
    page: number;
    pages: number;
    measuring: boolean;
    editable: boolean;
    /** editing: a column edge of the top-level table `bi` was dragged */
    colResize?: (bi: number, cols: number[]) => void;
}
/** one colour per author of tracked changes, given in the order authors are met (as Word does): the first 8 differ */
export declare function authorColor(author: string | undefined): string;
export declare function runCss(s: RunStyle | undefined): CSSProperties;
/** contextual spacing flags: 'b' drop space before, 'a' drop space after */
export type Spacing = '' | 'b' | 'a' | 'ba';
export declare function contextual(p: Block | undefined, prev: Block | undefined, next: Block | undefined): Spacing;
export interface BlockViewProps {
    block: Block;
    ctx: RenderCtx;
    /** editable address (top-level: block index; table: block index used as prefix) */
    pa?: string;
    sp?: Spacing;
    nested?: boolean;
}
export declare const BlockView: import("react").MemoExoticComponent<({ block, ctx, pa, sp, nested }: BlockViewProps) => import("react").JSX.Element>;
