import { type OdfStyles, type ONode } from './common';
/** the view settings of settings.xml: per table config items, active table, gridlines */
export declare function viewSettings(root: ONode | undefined): {
    tables: Map<string, Map<string, string>>;
    global: Map<string, string>;
};
/** printOptions, pageMargins, pageSetup and headerFooter of a sheet printed with a master page */
export declare function pageSetup(st: OdfStyles, master: string | undefined): {
    xml: string;
    fit: boolean;
};
/** the VML shapes Excel shows notes with */
export declare function vmlNotes(notes: {
    r: number;
    c: number;
    shown: boolean;
}[], block: number): string;
