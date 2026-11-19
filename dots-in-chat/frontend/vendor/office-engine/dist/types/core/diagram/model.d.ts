/** What a diagram source parses to, and its picture. */
import { type Gantt, type Pie, type TreeNode } from './charts';
import { type Graph, type Rendered } from './graph';
import { type Sequence } from './sequence';
export type Model = {
    t: 'graph';
    graph: Graph;
} | {
    t: 'sequence';
    seq: Sequence;
} | {
    t: 'pie';
    pie: Pie;
} | {
    t: 'gantt';
    gantt: Gantt;
} | {
    t: 'tree';
    root: TreeNode;
    title?: string;
};
export declare function renderModel(m: Model): Rendered;
