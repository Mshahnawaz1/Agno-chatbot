/**
 * An SVG file as the picture of a document: its size read from the root element (width / height in any unit, else
 * the viewBox), the root given the SVG namespace when the file leaves it out (an <img> of image/svg+xml shows
 * nothing without it). The drawing itself is kept as it is: an <img> runs no script and loads nothing external.
 */
import type { ImportImage } from './convert';
/** the text is an SVG document: an XML declaration, comments and a doctype may come before the root */
export declare const isSvg: (text: string) => boolean;
/**
 * The picture an SVG file is: its size in px (width / height; one of them with the viewBox's ratio; the viewBox;
 * else 300 × 150, a browser's default), its <title> as alt text, its root declaring the namespaces it uses. Throws
 * when the text has no <svg> element.
 */
export declare function svgImage(text: string): ImportImage;
/**
 * A URL to show a picture of a file in an <img>. An SVG gets a data: URL, never a blob: one: a blob: URL carries the
 * page's origin, so "Open image in new tab" (or dragging the image out) would run the SVG's script as the host
 * application; a data: document has an opaque origin and reaches nothing of it.
 */
export declare function pictureUrl(blob: Blob): Promise<string>;
