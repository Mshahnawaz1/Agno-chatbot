import { ZipArchive } from '../zip';
export { visioToPptx } from './convert';
/** extensions of Visio packages: drawing, template, stencil, and their macro-enabled variants */
export declare const VISIO_EXT: string[];
/** the ZIP is a Visio package: its document part is where every Visio version writes it */
export declare const isVisioZip: (zip: ZipArchive) => boolean;
/** Converts a Visio package to the PowerPoint archive it is shown as. */
export declare function openVisio(zip: ZipArchive): Promise<{
    zip: ZipArchive;
    from: 'visio';
}>;
