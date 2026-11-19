import type { Block, DocxMeta, HFKind } from '../../core/docx/types';
/**
 * The header and footer a page shows (`index`: 0-based) and the editable kind each is: the first page's when "different
 * first page" is on, else the even pages' when the file has different odd / even ones, else the default. An even page
 * without an even part shows none, as in Word.
 */
export declare function pageHF(meta: DocxMeta | undefined, index: number): {
    header?: Block[];
    footer?: Block[];
    hk: HFKind;
    fk: HFKind;
};
/** the blocks [start, end) of a page and the height they take */
export interface PageSlice {
    start: number;
    end: number;
    used: number;
}
/**
 * Cuts the blocks into pages. With text columns (`cols` > 1) a page holds `cols` columns of `avail`: a block that does
 * not fit what is left of a column starts the next one (blocks are never split, as for pages), and `used` is the
 * tallest column.
 */
export declare function paginate(blocks: Block[], heights: WeakMap<Block, number>, count: number, avail: number, cols?: number, lastKind?: string): PageSlice[];
