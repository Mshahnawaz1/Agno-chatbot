/**
 * Layered ("hierarchical") graph layout, in the spirit of Sugiyama's method:
 * cycles broken by reversing DFS back edges → ranks (longest path, then each node moved to where its edges are
 * shortest) → long edges split by dummy nodes (edge labels ride on one) → crossings reduced by barycenter sweeps
 * that keep clusters contiguous → coordinates by weighted isotonic regression per rank (long edges pulled straight)
 * → clusters legalised so no foreign node falls inside a cluster's box.
 *
 * Works in "layout space": ranks go down (y), the order within a rank goes right (x). The caller turns LR / BT / RL
 * graphs by swapping or mirroring axes (and node sizes) on the way in and out.
 */
import type { Pt } from './svg';
export interface LNode {
    /** size across the rank (x) and along the rank axis (y) */
    w: number;
    h: number;
    /** innermost cluster, -1 for none */
    cluster: number;
    /** extra room after the node in its rank (self loops) */
    loop?: number;
    /** edges meeting a flat side spread out along it (boxes) instead of meeting at its middle */
    spread?: boolean;
}
export interface LEdge {
    v: number;
    w: number;
    minlen: number;
    weight: number;
    label?: {
        w: number;
        h: number;
    };
}
export interface LCluster {
    parent: number;
    /** padding: cross start (left), cross end (right), rank start (top), rank end (bottom) */
    pad: [number, number, number, number];
    /** least width (the title) */
    minW: number;
}
export interface LayoutOpts {
    nodesep: number;
    ranksep: number;
    edgesep: number;
    /** groups of nodes put on one rank (Graphviz rank=same) */
    sameRank?: number[][];
}
export interface Seg {
    c: 'L' | 'C';
    p: Pt[];
}
export interface EdgeGeom {
    start: Pt;
    segs: Seg[];
    label?: Pt;
}
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface LayoutOut {
    nodes: Pt[];
    /** null for self loops (the caller draws them) */
    edges: (EdgeGeom | null)[];
    /** null for a cluster without nodes */
    clusters: (Box | null)[];
    w: number;
    h: number;
}
export declare function layered(nodes: LNode[], edges: LEdge[], clusters: LCluster[], o: LayoutOpts): LayoutOut;
