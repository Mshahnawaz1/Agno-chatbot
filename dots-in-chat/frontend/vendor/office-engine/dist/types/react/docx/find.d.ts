/**
 * Find in a document: text and query are compared in NFC, lower case, so "Việt" typed composed matches "Việt" pasted
 * decomposed (macOS file names, web text). Positions are those of the original text.
 */
/** [start, end) of each non-overlapping match of `query` in `text`, at most `max` */
export declare function findAll(text: string, query: string, max?: number): [number, number][];
