/**
 * The text of a Visio shape: characters with markers between them that name the Character (`cp`) and Paragraph
 * (`pp`) rows in force from there on, and fields (`fld`) holding their shown value.
 */
import type { VNode } from './sheet';
export interface VRun {
    text: string;
    /** Character row */
    cp: string;
    /** a line break inside the paragraph */
    br?: boolean;
}
export interface VPara {
    /** Paragraph row */
    pp: string;
    runs: VRun[];
}
/** The paragraphs of a `Text` element; none when it holds no characters. */
export declare function readText(el: VNode | undefined): VPara[];
