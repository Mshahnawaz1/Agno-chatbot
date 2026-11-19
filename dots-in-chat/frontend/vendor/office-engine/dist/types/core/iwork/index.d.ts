import { ZipArchive } from '../zip';
export { isIworkZip } from './iwa';
export type IworkApp = 'pages' | 'keynote' | 'numbers';
/** Converts a Pages, Keynote or Numbers package to the Office archive it is shown as. */
export declare function openIwork(zip: ZipArchive): Promise<{
    zip: ZipArchive;
    from: IworkApp;
}>;
/** iWork '09 and older packages: XML in index.xml(.gz) / index.apxl(.gz) */
export declare function isLegacyIwork(zip: ZipArchive): boolean;
