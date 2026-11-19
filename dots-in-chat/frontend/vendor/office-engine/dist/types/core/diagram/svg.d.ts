/**
 * SVG output for the diagram renderers: text metrics (no DOM: the worker has none), escaping, colors and a small
 * builder. Pictures are self-contained (no scripts, links, external references, markers or CSS) so they show the
 * same in an <img>, in Word and in a PDF export.
 */
export declare const FONT = "Helvetica, Arial, sans-serif";
export declare const MONO = "Menlo, Consolas, \"Courier New\", monospace";
/** Width in px of one line of text at `size` px. */
export declare function textWidth(text: string, size?: number, bold?: boolean, mono?: boolean): number;
export declare const lineHeight: (size: number) => number;
/** Size of a block of lines. */
export declare function measure(lines: string[], size?: number, bold?: boolean): {
    w: number;
    h: number;
};
/** Breaks lines longer than `max` px at spaces. */
export declare function wrap(lines: string[], max: number, size?: number, bold?: boolean): string[];
export declare const esc: (s: string) => string;
/** A color from the source, or undefined when it is not one a picture can carry safely (#rgb, rgb(), a name). */
export declare function color(c: string | undefined): string | undefined;
export declare const THEME: {
    ink: string;
    line: string;
    fill: string;
    stroke: string;
    muted: string;
    cluster: string;
    clusterStroke: string;
    note: string;
    noteStroke: string;
    label: string;
    dark: string;
    /** categorical series: pie slices, gantt sections */
    series: string[];
};
export interface Paint {
    fill?: string;
    stroke?: string;
    sw?: number;
    dash?: string;
    opacity?: number;
}
export interface TextOpts {
    size?: number;
    anchor?: 'start' | 'middle' | 'end';
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    mono?: boolean;
}
export declare class Svg {
    private out;
    rect(x: number, y: number, w: number, h: number, p: Paint, rx?: number): this;
    circle(cx: number, cy: number, r: number, p: Paint): this;
    ellipse(cx: number, cy: number, rx: number, ry: number, p: Paint): this;
    line(x1: number, y1: number, x2: number, y2: number, p: Paint): this;
    poly(points: [number, number][], p: Paint, closed?: boolean): this;
    /** `d` uses numbers rounded by the caller (see `pathData`) */
    path(d: string, p: Paint): this;
    /** Lines of text, the block centered vertically on `y`. */
    text(x: number, y: number, lines: string[] | string, o?: TextOpts): this;
    raw(s: string): this;
    /** the elements drawn so far */
    body(): string;
    /** The picture; `bg` paints the canvas. */
    toString(w: number, h: number, bg?: string): string;
}
export type Pt = {
    x: number;
    y: number;
};
export declare function pathData(cmds: {
    c: 'M' | 'L' | 'C' | 'Q';
    p: Pt[];
}[]): string;
/** Mermaid / PlantUML / DOT label text: entity codes, <br>, markdown-string quotes, tags dropped. */
export declare function labelText(s: string): string;
/** Mermaid "`markdown string`": the text without the markup */
export declare const unMarkdown: (s: string) => string;
export declare class DiagramError extends Error {
}
