import { type ONode } from './common';
import { type OdpStyles, type Props } from './odp-style';
/** what text needs from the converter */
export interface TextEnv {
    styles: OdpStyles;
    /** converting a master page: automatic styles of styles.xml */
    master: boolean;
    /** 1-based slide number for page number fields; 0 on masters (the field shows ‹#›) */
    slideNo: number;
    slideCount: number;
    slideName?: string;
    /** texts of presentation:footer, presentation:header and presentation:date-time fields */
    footer?: string;
    header?: string;
    dateTime?: string;
    /** automatic font color: white on dark backgrounds */
    dark: boolean;
    /** relationship id of a link (an external URL or a slide) */
    link(href: string): string | undefined;
    /** text properties over every run's (fontwork: the size and color of the shape) */
    force?: Record<string, string>;
}
/** a text frame: its properties by outline level, its paragraph style, its list style */
export interface TextFrame {
    /** default + frame style properties of paragraphs at an outline level (1-based) */
    level(n: number): Props;
    /** draw:text-style-name */
    textStyle?: string;
}
export declare const fontSize: (t: Record<string, string>) => number;
/** run properties (a:rPr, a:endParaRPr, a:defRPr) of text properties */
export declare function rPrXml(tag: string, t: Record<string, string>, env: TextEnv, link?: string): string;
/** the a:p elements of a text container (draw:text-box, a shape, a table cell); '' without paragraphs */
/** what the height of a paragraph is estimated from (shrinking text to fit its frame) */
export interface ParaMetric {
    /** widths of the lines between forced breaks, in ems × font size (pt) */
    widths: number[];
    sz: number;
    /** line height: proportional (1 = single) or exact (pt) */
    lnPct?: number;
    lnPts?: number;
    before: number;
    after: number;
    marL: number;
    indent: number;
}
export declare function paragraphsXml(container: ONode, frame: TextFrame, env: TextEnv, metrics?: ParaMetric[]): string;
/**
 * Font scale (0.25…1) and line spacing reduction that make estimated text fit a w × h area, as
 * shrink-on-overflow autofit does: [1, 0] when it fits already. Paragraph spacing is not scaled.
 */
export declare function fitScale(metrics: ParaMetric[], w: number, h: number): [number, number];
/** a:lvlNpPr of a master text style: paragraph properties, label of the list level and default run properties */
export declare function lvlXml(n: number, pp: Props, list: ONode | undefined, env: TextEnv, labeled?: boolean): string;
/**
 * a:bodyPr of graphic properties: insets, anchoring, wrapping, autofit. `frame`: a text frame (draw:frame), whose
 * text wraps at its width unless it grows with its text.
 */
/** text shrinks on overflow (autofit) */
export declare const shrinks: (g: Record<string, string>) => boolean;
/** the padding of a text frame (pt): left, top, right, bottom */
export declare const padding: (g: Record<string, string>) => number[];
export declare function bodyPrXml(g: Record<string, string>, p: Record<string, string>, opts: {
    frame: boolean;
    autoGrow: boolean;
    scale?: [number, number];
}): string;
