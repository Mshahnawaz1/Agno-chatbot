import { type Blip } from './art';
import type { Chp } from './props';
import type { StoryKind, Writer } from './writer';
export interface MediaFile {
    name: string;
    blip: Blip;
}
/** Writes the pictures and shapes of the stories a Writer writes; collects the media files. */
export declare class Pictures {
    private w;
    readonly media: MediaFile[];
    private mediaByData;
    private docPr;
    constructor(w: Writer);
    private mediaName;
    /** the a:graphic of a picture */
    private picGraphic;
    private inline;
    /** an inline picture (0x01 with sprmCPicLocation): from the Data stream, or an OLE object's preview */
    inlinePicture(chp: Chp, rPr: string): string;
    /** the picture an embedded object shows: its size (\x03PIC) and metafile (\x03META) in the ObjectPool */
    private olePicture;
    /** a floating shape (0x08): pictures, text boxes and filled shapes (each shape of a group), anchored where the original is */
    floating(cp: number, kind: StoryKind, rPr: string): string;
    /** the graphic of a shape: a picture, WordArt text, or a box (with the text of its text box) */
    private shapeGraphic;
    /** a shape (wps:wsp) of a preset geometry, holding `body` as its text box */
    private boxGraphic;
    private txbxStory;
}
