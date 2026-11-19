import type { Block } from '../../core/docx/types';
import type { SlideModel } from '../../core/pptx/types';
/** Plain text: one line per paragraph, list markers kept, table cells separated by tabs. */
export declare function docxToText(blocks: Block[]): string;
/** pictures of a document as data URLs, by part path (see pictureData) */
export type Pictures = Map<string, string>;
/** Markdown: headings (outline levels), lists, bold / italic / strike, links, tables, pictures (as data URLs when given). */
export declare function docxToMarkdown(blocks: Block[], images?: Pictures): string;
/**
 * A web page of the document: headings (outline levels), paragraphs, nested lists, bold / italic / underline / strike,
 * links, code, colors, tables, pictures (as data URLs when given). The text reads with its tracked changes accepted.
 */
export declare function docxToHtml(blocks: Block[], opts?: {
    title?: string;
    images?: Pictures;
}): string;
/** the elements of a page's body for the blocks (see docxToHtml) */
export declare function docxBodyHtml(blocks: Block[], images?: Pictures): string;
/** The pictures of a document (paragraphs and table cells) as data URLs, by part path; `part` reads a package part. */
export declare function pictureData(blocks: Block[], part: (target: string) => Promise<Blob>): Promise<Pictures>;
/** Text of each slide (shapes, tables, speaker notes). */
export declare function slidesToText(slides: SlideModel[]): string;
/** RFC 4180 output (CRLF; fields with separators, quotes or line breaks are quoted). */
export { toCsv } from '../../core/convert';
