import type { Rendered } from './graph';
export type DiagramLang = 'mermaid' | 'plantuml' | 'graphviz';
export type { Rendered as DiagramImage } from './graph';
export { DiagramError } from './svg';
/** file extensions of diagram sources */
export declare const DIAGRAM_EXT: Record<string, DiagramLang>;
/** Markdown code fence languages */
export declare const FENCE_LANG: Record<string, DiagramLang>;
export declare const DIAGRAM_NAME: Record<DiagramLang, string>;
/** the diagram language of a text without a name: @startuml, digraph { }, a Mermaid header */
export declare function sniffDiagram(text: string): DiagramLang | null;
/** The pictures a diagram source draws (PlantUML and DOT files may hold several). Throws a DiagramError. */
export declare function renderDiagrams(lang: DiagramLang, text: string): Rendered[];
