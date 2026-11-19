/**
 * What a file is when it is not what its name says (a PDF renamed .docx, a cut-short download, a web page saved as
 * .xls): the words for the error a user reads, and the formats of text files the engine cannot open.
 */
/** said for every encrypted Office file (a compound file holding an encrypted package, a Word / Excel password flag) */
export declare const PASSWORD_MESSAGE = "This file is password-protected (encrypted): open it in Office and save it without a password";
/** what a binary file is by its first bytes, as "a PDF file"; null when it is not a format known here */
export declare function describeBinary(b: Uint8Array): string | null;
/** the error for a text file the engine cannot read as the Office file it is named, or null when it is not one of those */
export declare function unreadText(text: string): string | null;
/**
 * The message for a file that is not a ZIP package, an Office compound file or a text file, though its name says it is
 * a document: it says what the file is (or that it is empty or cut short) and what to do.
 */
export declare function notOffice(b: Uint8Array, size: number): string;
