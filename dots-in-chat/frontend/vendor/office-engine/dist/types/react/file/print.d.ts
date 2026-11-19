import type { ReactNode } from 'react';
/** Content laid out for paper: PDF / print and standalone HTML. */
export interface Printable {
    /** the pages (`.de-print-page` elements) or flowing content */
    node: ReactNode;
    /** CSS `@page` size: '612pt 792pt', 'landscape', 'auto' */
    size: string;
    /** CSS `@page` margin */
    margin: string;
    /** shown to the user (e.g. output was truncated) */
    notice?: string;
}
/** Opens the browser print dialog for the content (choose "Save as PDF" there). */
export declare function printDocument(p: Printable, title: string): Promise<void>;
/** Standalone web page of the content (pictures embedded). */
export declare function exportHtml(p: Printable, title: string): Promise<Blob>;
