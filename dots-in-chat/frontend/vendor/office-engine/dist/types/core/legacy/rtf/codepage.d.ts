/** Code pages of RTF text: `\ansicpg`, `\mac` / `\pc`, font `\fcharset` / `\cpg`, decoded with TextDecoder. */
/** symbol fonts (\fcharset2): bytes become U+F0xx, the code points Word gives their glyphs */
export declare const CP_SYMBOL = 42;
/** the code page of a font's \fcharset, given the document's code page */
export declare function charsetCp(charset: number | undefined, ansi: number): number;
/** a known code page number (\ansicpg, \cpg) or undefined */
export declare function knownCp(cp: number): number | undefined;
/** Decodes bytes of code page `cp`. */
export declare function decode(bytes: Uint8Array, cp: number): string;
