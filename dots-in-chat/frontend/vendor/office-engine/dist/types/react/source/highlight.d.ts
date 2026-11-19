/**
 * Syntax colors for the source editor: Markdown (diagram code blocks in their own language), HTML, SVG, Mermaid,
 * PlantUML and Graphviz DOT. Line based, with the few states that span lines (code blocks, block comments).
 */
import type { PlainFormat } from '../../core/plain';
/** [class, text]; class '' is plain text. Classes: c comment, k keyword, s string, o arrow / operator, n number,
 * h heading, a attribute / link, t tag, m code, b bold, i italic */
export type Token = [string, string];
/** Tokens of the whole text, lines separated by "\n" tokens. Over `max` characters: no colors. */
export declare function highlight(format: PlainFormat, text: string, max?: number): Token[];
