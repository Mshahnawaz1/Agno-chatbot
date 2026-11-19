import type { Merge, Range } from '../../core/xlsx/types';
import type { DocumentClient } from '../../core/worker/client';
export interface XlsxViewProps {
    client: DocumentClient;
    onStatus?: (s: string) => void;
    initialSheet?: number;
}
export declare function XlsxView({ client, onStatus, initialSheet }: XlsxViewProps): import("react").JSX.Element;
export { ContextMenu, type MenuItem } from '../common/ContextMenu';
interface Selection {
    ar: number;
    ac: number;
    fr: number;
    fc: number;
    /** selected as whole columns / rows / the sheet (a header, Ctrl+Space…), not as the cells there are: a format goes to the columns / rows themselves */
    whole?: 'col' | 'row' | 'all';
}
export declare const rectOf: (s: Selection) => Range;
/** grows a range until it holds every merged cell it touches (like Excel / Sheets selections) */
export declare function withMerges(r: Range, merges: Merge[]): Range;
