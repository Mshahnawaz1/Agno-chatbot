export declare const D_STORY = 0;
export declare const D_NONE = 1;
export declare const D_TEXT = 2;
export declare const D_FONT = 3;
export declare const D_COLOR = 4;
export declare const D_PICT = 5;
export declare const D_UPR = 6;
export declare const D_STYLE = 7;
export declare const D_SHEET = 8;
/** small text (font and style names, field instructions, bookmark names, list level text) */
export declare class TextAcc {
    private parts;
    private bytes;
    private cp;
    byte(b: number, cp: number): void;
    str(s: string): void;
    private flush;
    text(): string;
}
/** text of the run being read: bytes (decoded at the end, so double-byte characters stay whole) and characters */
export declare class RunBuf {
    private b;
    private n;
    private cp;
    private parts;
    get empty(): boolean;
    bytes(src: Uint8Array, s: number, e: number, cp: number): void;
    byte(v: number, cp: number): void;
    str(s: string): void;
    private flushBytes;
    take(): string;
}
/** a w:r of text: tabs, breaks and hyphens become their elements; characters XML cannot hold are dropped */
export declare function runXml(text: string, rPr: string): string;
