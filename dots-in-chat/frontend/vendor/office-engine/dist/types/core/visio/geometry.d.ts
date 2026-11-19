/**
 * The Geometry sections of a Visio shape as paths: rows of moves, lines, circular and elliptical arcs, Béziers,
 * polylines and NURBS in the shape's own coordinates (inches, y up, origin at the bottom left of its box), turned
 * into moves, lines and cubic Béziers. Any affine transform of those is the path transformed.
 */
import { type Geometry } from './sheet';
export type Seg = {
    t: 'M';
    x: number;
    y: number;
} | {
    t: 'L';
    x: number;
    y: number;
} | {
    t: 'C';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x: number;
    y: number;
} | {
    t: 'Z';
};
/** [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f */
export type Matrix = [number, number, number, number, number, number];
export declare const IDENTITY: Matrix;
/** `m` applied after `n` */
export declare function mul(m: Matrix, n: Matrix): Matrix;
export declare const apply: (m: Matrix, x: number, y: number) => [number, number];
/** a box's place in its parent: its pin moved to (px, py), turned by `angle`, flipped about its local pin */
export declare function placement(px: number, py: number, lx: number, ly: number, angle: number, flipX: boolean, flipY: boolean): Matrix;
/** The path of one Geometry section in the shape's coordinates; `w`, `h`: the shape's box. */
export declare function sectionPath(g: Geometry, w: number, h: number): Seg[];
export interface SubPath {
    segs: Seg[];
    closed: boolean;
}
/** A path split at its moves; a part that ends where it starts is closed. */
export declare function subPaths(segs: Seg[]): SubPath[];
/** Corners between two straight lines rounded with radius `r` (the Rounding cell). */
export declare function roundCorners(sp: SubPath, r: number): SubPath;
/** the path with every point sent through `m` */
export declare function transform(segs: Seg[], m: Matrix): Seg[];
