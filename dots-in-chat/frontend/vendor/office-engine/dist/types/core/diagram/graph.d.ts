export type Dir = 'TB' | 'BT' | 'LR' | 'RL';
export type Shape = 'rect' | 'round' | 'stadium' | 'subroutine' | 'cylinder' | 'circle' | 'doublecircle' | 'ellipse' | 'diamond' | 'hexagon' | 'lean-r' | 'lean-l' | 'trap-b' | 'trap-t' | 'flag' | 'note' | 'folder' | 'component' | 'box3d' | 'cloud' | 'octagon' | 'triangle' | 'actor' | 'start' | 'end' | 'bar' | 'point' | 'none';
export type Head = 'none' | 'arrow' | 'open' | 'triangle' | 'diamond' | 'odiamond' | 'circle' | 'ocircle' | 'cross' | 'one' | 'zero-one' | 'one-many' | 'zero-many' | 'many';
export interface NodeStyle {
    fill?: string;
    stroke?: string;
    color?: string;
    dash?: string;
    sw?: number;
    bold?: boolean;
    italic?: boolean;
    hidden?: boolean;
}
/** A compartment of a class / entity / record box: rows of cells (cells line up in columns) */
export interface Section {
    rows: string[][];
    bold?: boolean;
    italic?: boolean;
    center?: boolean;
}
export interface GNode {
    id: string;
    label: string;
    shape: Shape;
    style?: NodeStyle;
    sections?: Section[];
    cluster?: string;
}
export interface GEdge {
    from: string;
    to: string;
    label?: string;
    head?: Head;
    tail?: Head;
    line?: 'solid' | 'dashed' | 'dotted' | 'thick' | 'hidden';
    minlen?: number;
    headLabel?: string;
    tailLabel?: string;
    color?: string;
    sw?: number;
}
export interface GCluster {
    id: string;
    label: string;
    parent?: string;
    style?: NodeStyle;
}
export interface Graph {
    dir: Dir;
    nodes: GNode[];
    edges: GEdge[];
    clusters: GCluster[];
    sameRank?: string[][];
    title?: string;
}
export interface Rendered {
    svg: string;
    w: number;
    h: number;
}
/** Builds a graph: nodes are created on first mention and refined by later ones. */
export declare class GraphBuilder {
    private defShape;
    readonly g: Graph;
    private byId;
    private clusterIds;
    constructor(dir?: Dir, defShape?: Shape);
    has(id: string): boolean;
    get(id: string): GNode | undefined;
    node(id: string, patch?: Partial<GNode>, cluster?: string): GNode;
    edge(e: GEdge, cluster?: string): GEdge;
    cluster(id: string, label: string, parent?: string): GCluster;
    isCluster(id: string): boolean;
}
export declare function renderGraph(g: Graph): Rendered;
