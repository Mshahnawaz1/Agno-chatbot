import { type Rendered } from './graph';
import { type Model } from './model';
/** the diagrams of a file: the text of each @startX … @endX block (the whole text when there is none) */
export declare function plantUmlBlocks(src: string): {
    kind: string;
    lines: string[];
}[];
export declare function parsePlantUml(src: string): Model[];
export declare const renderPlantUml: (src: string) => Rendered[];
/** creole / HTML markup out of a label */
export declare function pText(s: string): string;
