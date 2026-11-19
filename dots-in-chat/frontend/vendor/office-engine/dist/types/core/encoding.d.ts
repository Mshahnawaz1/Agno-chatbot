/**
 * Text encodings of files that declare none. Old Excel for Vietnamese Windows saves CSV as Windows-1258, which
 * Windows-1252 (the fallback for bytes that are not UTF-8) reads as `NguyêÞn Vãn Ðýìc`.
 */
/**
 * Whether bytes that are not UTF-8 are Windows-1258 (Vietnamese): read as such, the text has tone marks (combining
 * U+0300 / 0301 / 0303 / 0309 / 0323) after vowels, and no more of them after anything else. Other languages' text
 * read this way has none after vowels: Italian ì / ò come after consonants, Portuguese ã / õ and Icelandic ð / þ
 * are single letters.
 */
export declare function isWindows1258(b: Uint8Array): boolean;
/** the label `TextDecoder` knows it by, or null for a label it does not know */
export declare function knownEncoding(label: string): string | null;
/** Windows-1258 puts a letter and its tone mark apart (a + U+0301): the text is composed */
export declare const composes: (encoding: string) => encoding is "windows-1258";
