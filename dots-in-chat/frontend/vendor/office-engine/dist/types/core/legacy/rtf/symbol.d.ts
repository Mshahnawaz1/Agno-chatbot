/** Symbol / Wingdings text: the characters of these fonts sit in U+F020…U+F0FF; where Unicode has the glyph, it is used instead */
/**
 * `text` set in the font `font` with the characters it has no Unicode glyph for left as they are (U+F0xx, shown in the font).
 * Other fonts' text comes back unchanged.
 */
export declare function symbolToUnicode(text: string, font: string | undefined): string;
