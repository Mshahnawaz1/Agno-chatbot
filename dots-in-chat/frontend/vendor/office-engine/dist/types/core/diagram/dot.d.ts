/**
 * Graphviz DOT: graphs, digraphs, subgraphs and clusters, default attributes, edge chains, rank=same, record and
 * HTML-like labels (as text). Laid out by the layered layout, like `dot`.
 * https://graphviz.org/doc/info/lang.html
 */
import { type Graph, type Rendered } from './graph';
export declare function parseDot(src: string): Graph[];
export declare function renderDot(src: string): Rendered;
export declare function renderDotAll(src: string): Rendered[];
