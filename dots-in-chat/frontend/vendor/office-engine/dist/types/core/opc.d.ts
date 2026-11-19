import { ZipArchive } from './zip';
import { type PartData } from './zipwrite';
import { type XEl } from './xml';
export type DocKind = 'docx' | 'xlsx' | 'pptx';
export interface Rel {
    id: string;
    type: string;
    target: string;
    external: boolean;
}
export type Rels = Map<string, Rel>;
export declare function mimeOf(path: string): string;
/** Browser-renderable image? (EMF/WMF/TIFF are not.) */
export declare function isWebImage(path: string): boolean;
export declare function dirOf(part: string): string;
export declare function resolvePath(baseDir: string, target: string): string;
/** Inverse of resolvePath: target of `abs` relative to directory `fromDir`. */
export declare function relativeTarget(fromDir: string, abs: string): string;
export declare function relsPathFor(part: string): string;
export declare class OpcPackage {
    readonly zip: ZipArchive;
    private relsCache;
    private xmlCache;
    private contentTypes?;
    /** edited parts: normalized path → { path, data } (data null = deleted) */
    private changes;
    constructor(zip: ZipArchive);
    has(path: string): boolean;
    get dirty(): boolean;
    /** paths of the parts the package holds now (those added in this session with them, those deleted without) */
    paths(): string[];
    /** Current text of a part (edited version if any). */
    text(path: string): Promise<string>;
    /** Decompressed stream of the current version of a part (edited parts included). */
    stream(path: string, onRaw?: (consumed: number, total: number) => void): Promise<ReadableStream<Uint8Array>>;
    /** what a part was set to in this session (null: deleted); undefined when it is as read */
    changed(path: string): PartData | null | undefined;
    setPart(path: string, data: PartData | null): void;
    /**
     * Refuses a main part that is not XML: a tool that wrote something else there leaves a blank document, and the
     * garbage would be saved back as the document.
     */
    assertXml(path: string): Promise<void>;
    /**
     * The format of the package as its main part declares it: a workbook with macros is an .xlsm, a template an .xltx…
     * A file named or typed otherwise is one Excel / Word / PowerPoint refuse to open. Undefined for a plain document.
     */
    flavor(): Promise<{
        ext: string;
        mime: string;
    } | undefined>;
    /** Builds the edited package; unchanged entries are copied without recompression. `type`: of a plain document of its kind. */
    save(type: string): Promise<Blob>;
    /** Adds a relationship from `part` to `target` (absolute part path); returns its id. */
    addRel(part: string, type: string, target: string, external?: boolean): Promise<string>;
    removeRelsTo(part: string, target: string): Promise<void>;
    /**
     * A package without `[Content_Types].xml` (some tools leave it out) opens, but is not one Office opens: the part is
     * written from what the relationships say each part is, when the package is edited or saved.
     */
    private ensureContentTypes;
    /** Ensures a <Default Extension=…> entry exists (for new media types). */
    ensureDefaultType(ext: string, contentType: string): Promise<void>;
    /** Free part name like `word/media/image7.png`. */
    freeName(dir: string, base: string, ext: string): string;
    setContentType(partName: string, contentType: string | null): Promise<void>;
    /** Parsed XML part (cached). Missing parts resolve to undefined. */
    xml(path: string, cache?: boolean): Promise<XEl | undefined>;
    rels(part: string): Promise<Rels>;
    contentType(path: string): Promise<string | undefined>;
    blob(path: string): Promise<Blob>;
    mainPart(): Promise<{
        path: string;
        kind: DocKind;
    }>;
}
export declare function relOfType(rels: Rels, suffix: string): Rel | undefined;
export declare function relsOfType(rels: Rels, suffix: string): Rel[];
