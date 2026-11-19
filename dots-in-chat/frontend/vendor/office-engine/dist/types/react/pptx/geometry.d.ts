/** SVG paths for common DrawingML preset geometries (box-local px). Unknown presets fall back to a rectangle. */
type Adj = Record<string, number> | undefined;
export declare const LINE_GEOMS: Set<string>;
export declare function geomPath(geom: string, w: number, h: number, adj: Adj): string;
export {};
