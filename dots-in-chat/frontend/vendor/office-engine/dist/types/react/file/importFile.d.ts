/** `accept` of the File → Open picker */
export declare const OPEN_ACCEPT: string;
export interface Imported {
    src: Blob;
    name: string;
    /** built from another format: not saved as an Office file yet */
    converted: boolean;
    /** a preview of the source being edited (the shown document stays until it is ready) */
    live?: boolean;
}
/**
 * Office, iWork (Pages, Keynote, Numbers) and Visio files open as they are; Word / Excel / PowerPoint 97-2003, RTF and
 * OpenDocument files are converted to Office Open XML; CSV / TSV become a workbook, text / Markdown / HTML, SVG and
 * Mermaid / PlantUML / Graphviz diagrams a document, also gzip-compressed (.svgz, .csv.gz).
 */
export declare function importFile(file: File): Promise<Imported>;
