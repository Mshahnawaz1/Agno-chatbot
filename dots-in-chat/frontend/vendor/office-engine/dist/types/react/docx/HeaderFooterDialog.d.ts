import type { Block, DocxMeta, HFKind, HFSet } from '../../core/docx/types';
interface Part {
    text: string;
    align: 'left' | 'center' | 'right';
    b: boolean;
    sz: string;
    /** holds pictures, tables or shapes the dialog can't show: saving replaces them */
    rich: boolean;
}
/** the editable form of a header / footer as converted for display */
export declare function partOf(blocks: Block[] | undefined): Part;
/**
 * Headers and footers of the document: text (a line per paragraph), alignment, bold, size, page number / page count,
 * a different first page. `onOk` gets only the parts that changed.
 */
export declare function HeaderFooterDialog({ meta, focus, onOk, onClose }: {
    meta: DocxMeta;
    focus?: HFKind;
    onOk: (set: HFSet) => void;
    onClose: () => void;
}): import("react").JSX.Element;
export {};
