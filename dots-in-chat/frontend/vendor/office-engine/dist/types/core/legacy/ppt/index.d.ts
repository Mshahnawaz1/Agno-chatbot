/** PowerPoint 97-2003 binary presentations (.ppt, MS-PPT) → PPTX. */
import type { Cfb } from '../cfb';
/** Converts the presentation in a compound file to a PPTX file. */
export declare function pptToPptx(cfb: Cfb): Promise<Blob>;
