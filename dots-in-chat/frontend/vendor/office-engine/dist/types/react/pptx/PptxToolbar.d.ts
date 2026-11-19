import type { ShapeKind } from '../../core/pptx/types';
import { type DropOption } from '../edit/Toolbar';
import type { PptxEditor } from './PptxEditor';
export declare const SHAPES: DropOption<string>[];
export type Arrange = 'front' | 'forward' | 'backward' | 'back';
export type Rotate = 'cw' | 'ccw' | 'flipH' | 'flipV';
export type AlignTo = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type SlideCmd = 'add' | 'duplicate' | 'delete' | 'up' | 'down' | 'hide';
export declare function PptxToolbar(props: {
    editor: PptxEditor;
    /** selected shape (not editing its text) */
    shape: {
        canText: boolean;
        anchor?: 't' | 'ctr' | 'b';
    } | null;
    /** anchor of the text box being edited */
    textAnchor?: 't' | 'ctr' | 'b';
    canUndo: boolean;
    onUndo: (redo: boolean) => void;
    onInsert: (k: ShapeKind) => void;
    onFill: (c: string | null) => void;
    onLine: (p: {
        color?: string | null;
        w?: number;
        dash?: string;
    }) => void;
    onArrange: (k: Arrange) => void;
    onRotate: (k: Rotate) => void;
    onAlign: (k: AlignTo) => void;
    onAnchor: (a: 't' | 'ctr' | 'b') => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onBackground: (c: string | null) => void;
    onSlide: (k: SlideCmd) => void;
    onPresent: (fromStart: boolean) => void;
}): import("react").JSX.Element;
