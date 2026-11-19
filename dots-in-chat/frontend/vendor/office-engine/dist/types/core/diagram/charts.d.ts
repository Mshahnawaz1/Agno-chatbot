/** Pie charts, Gantt charts and mind maps / work breakdown trees. */
import type { Rendered } from './graph';
export interface Pie {
    title?: string;
    showData?: boolean;
    slices: {
        label: string;
        value: number;
    }[];
}
export declare function renderPie(p: Pie): Rendered;
export interface GanttTask {
    name: string;
    start: number;
    end: number;
    done?: boolean;
    active?: boolean;
    crit?: boolean;
    milestone?: boolean;
}
export interface Gantt {
    title?: string;
    sections: {
        name: string;
        tasks: GanttTask[];
    }[];
}
export declare function renderGantt(g: Gantt): Rendered;
export interface TreeNode {
    label: string;
    shape?: 'rect' | 'round' | 'circle' | 'cloud' | 'hexagon' | 'none';
    side?: 'left' | 'right';
    children: TreeNode[];
}
export declare function renderTree(root: TreeNode, title?: string): Rendered;
