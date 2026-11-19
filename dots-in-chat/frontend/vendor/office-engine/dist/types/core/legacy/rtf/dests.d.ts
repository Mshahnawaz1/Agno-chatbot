import { type HfKind } from './model';
import type { RtfReader } from './reader';
/** a header or footer group */
export declare function headerFooter(r: RtfReader, kind: HfKind): void;
export declare function footnote(r: RtfReader): void;
/** \chftn: the note's mark (in a note), or the mark of the note that follows (in the text) */
export declare function noteMark(r: RtfReader): void;
export declare function bookmark(r: RtfReader, start: boolean, name: string): void;
export declare function fieldBegin(r: RtfReader): void;
export declare function fieldResult(r: RtfReader): void;
export declare function pictBegin(r: RtfReader): void;
export declare function shapeBegin(r: RtfReader, group: boolean): void;
/** \shptxt: the text of a text box */
export declare function shapeText(r: RtfReader): void;
/** \shprslt: what a reader without shapes shows, skipped when the shape is shown */
export declare function shapeResult(r: RtfReader): void;
