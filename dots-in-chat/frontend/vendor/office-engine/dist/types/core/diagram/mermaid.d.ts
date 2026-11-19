import { type Rendered } from './graph';
import { type Model } from './model';
export declare function parseMermaid(src: string): Model;
export declare const renderMermaid: (src: string) => Rendered;
/** Mermaid label text: quotes, markdown strings, icons, entities and <br> */
export declare function mText(raw: string): string;
/** a date in `fmt` (dayjs-style tokens), UTC */
export declare function parseDate(s: string, fmt: string): number | undefined;
