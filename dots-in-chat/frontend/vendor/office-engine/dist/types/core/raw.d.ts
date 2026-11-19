export interface RNode {
    q: string;
    a: string;
    c: RChild[];
    self: boolean;
}
export type RChild = RNode | string;
export declare const isNode: (x: RChild | undefined) => x is RNode;
export declare function parseRaw(xml: string): RChild[];
export declare function serialize(x: RChild | RChild[]): string;
export declare const local: (q: string) => string;
export declare const prefixOf: (q: string) => string;
export declare function rootEl(nodes: RChild[]): RNode | undefined;
export declare function kidsOf(n: RNode | undefined, loc?: string): RNode[];
export declare function kidOf(n: RNode | undefined, loc: string): RNode | undefined;
/** Attribute value by exact qualified name, or by local name when `loose`. */
export declare function getAttr(n: RNode, name: string, loose?: boolean): string | undefined;
export declare function setAttr(n: RNode, name: string, value: string | undefined): void;
export declare function el(q: string, attrs?: Record<string, string | undefined>, children?: RChild[]): RNode;
export declare function clone<T extends RChild>(x: T): T;
export declare function removeKids(n: RNode, loc: string | ((l: string) => boolean)): void;
/**
 * Replaces (or inserts) the child with local name `loc`, keeping schema order:
 * the new child goes before the first existing sibling that comes later in `order`.
 */
export declare function setOrdered(parent: RNode, child: RNode | undefined, loc: string, order: string[]): void;
export declare function escText(s: string): string;
export declare function escAttr(s: string): string;
export declare function textContent(n: RChild): string;
/**
 * Preorder walk mirroring TreeBuilder semantics: mc:Fallback skipped, only the first
 * mc:Choice of an mc:AlternateContent is visited. `visit` returns true to stop descending.
 */
export declare function walkOoxml(n: RNode, visit: (node: RNode, parent: RNode, index: number) => boolean | void, understood?: ReadonlySet<string>): void;
/** attributes for an `r:id`-style reference that are valid whatever prefixes the root declared */
export declare function relIdAttrs(root: RNode, local: string | undefined, value: string): Record<string, string>;
