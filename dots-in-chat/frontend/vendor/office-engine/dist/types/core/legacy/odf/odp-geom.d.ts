/**
 * Geometry for the ODP → PPTX conversion: frames (svg:x/y/width/height and draw:transform), custom shapes
 * (draw:enhanced-geometry: preset names, or the path with its equations as a DrawingML custom geometry),
 * SVG paths, polygons and ellipse segments.
 */
import { type ONode } from './common';
/** a frame on the slide, in points; rotation clockwise in degrees */
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    rot: number;
    flipH: boolean;
    flipV: boolean;
}
/** 2D affine matrix: x' = a x + c y + e, y' = b x + d y + f */
type Mat = [number, number, number, number, number, number];
/**
 * draw:transform, its operations applied left to right (as LibreOffice does). ODF rotations turn
 * counterclockwise on the page.
 */
export declare function parseTransform(v: string | undefined): Mat | undefined;
/** the frame of a shape: svg:x, svg:y, svg:width, svg:height and draw:transform */
export declare function frameBox(el: ONode): Box | undefined;
/** the end points of a line (draw:line, draw:connector, draw:measure), transformed */
export declare function linePoints(el: ONode): [number, number, number, number];
export interface Geom {
    /** a:prstGeom or a:custGeom */
    xml: string;
    flipH: boolean;
    flipV: boolean;
    /** a line or curve that is not closed (no fill) */
    open: boolean;
    /**
     * mirrored on one axis: LibreOffice mirrors such a shape after rotating it, so its rotation turns the other
     * way in DrawingML (which flips first)
     */
    turn?: boolean;
    /** the text area's distances from the frame edges (pt): left, top, right, bottom (added to the insets) */
    textArea?: [number, number, number, number];
}
export declare const RECT: string;
/** a draw:custom-shape's geometry in a w × h (pt) box */
export declare function customGeom(eg: ONode | undefined, w: number, h: number): Geom;
/** the bounds of an svg:d (all points, control points included) */
export declare function svgPathBounds(d: string): [number, number, number, number] | undefined;
/** draw:path (svg:d in its svg:viewBox) as a custom geometry; `origin` overrides the view box origin */
export declare function svgPathGeom(el: ONode, w: number, h: number, origin?: [number, number, number, number]): Geom | undefined;
/** draw:polygon / draw:polyline (draw:points in the svg:viewBox) */
export declare function polyGeom(el: ONode, w: number, h: number, closed: boolean): Geom | undefined;
/** draw:ellipse / draw:circle: full, or a section, cut or arc between draw:start-angle and draw:end-angle */
export declare function ellipseGeom(el: ONode, w: number, h: number): Geom;
/** draw:regular-polygon: a polygon or star with draw:corners corners */
export declare function regularGeom(el: ONode, w: number, h: number): Geom;
/** draw:rect: a rectangle, rounded by draw:corner-radius */
export declare function rectGeom(el: ONode, w: number, h: number): Geom;
export {};
