import { type ReactNode } from 'react';
export interface Match {
    pa: string;
    a: number;
    b: number;
    bi: number;
}
export declare function FindBar(props: {
    query: string;
    index: number;
    count: number;
    editable: boolean;
    onQuery: (q: string) => void;
    onNav: (d: 1 | -1) => void;
    onClose: () => void;
    onReplace: (text: string, all: boolean) => void;
    placeholder?: string;
    /** extra controls (match case…) under the search row */
    options?: ReactNode;
    /** open with the replace row visible */
    replace?: boolean;
}): import("react").JSX.Element;
