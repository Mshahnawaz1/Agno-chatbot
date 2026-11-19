import type { PlainFormat } from '../../core/plain';
export interface SourceEditorProps {
    text: string;
    format: PlainFormat;
    onChange: (text: string) => void;
    readOnly?: boolean;
    /** a line under the header (e.g. what editing the source does) */
    notice?: string;
    onCopy?: () => void;
    onDownload?: () => void;
}
/**
 * The text of a Markdown / HTML / SVG / diagram file, editable, with line numbers and syntax colors: a transparent
 * textarea over the colored text, both sized by their content in one grid cell (they scroll together).
 */
export declare function SourceEditor({ text, format, onChange, readOnly, notice, onCopy, onDownload }: SourceEditorProps): import("react").JSX.Element;
