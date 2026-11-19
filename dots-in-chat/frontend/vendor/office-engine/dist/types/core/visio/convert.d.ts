import type { ZipArchive } from '../zip';
/**
 * What a drawing may ask for. A small file can draw without end: every instance of a master draws all of the
 * master's shapes again. Past these the file is refused, instead of the slides being built.
 */
export declare const VISIO_LIMITS: {
    /** shapes drawn in the whole document */
    shapes: number;
    /** characters of slide XML written in the whole document */
    output: number;
};
/** Converts an opened Visio package (.vsdx, .vsdm, .vstx, .vssx…) to a PPTX file. */
export declare function visioToPptx(zip: ZipArchive): Promise<Blob>;
