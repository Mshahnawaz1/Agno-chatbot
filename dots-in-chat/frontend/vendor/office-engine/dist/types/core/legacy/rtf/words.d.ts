import type { RtfReader } from './reader';
type Fn = (r: RtfReader, p: number, has: boolean) => void;
/** `dest`: a destination, handled even when its group is ignorable (`\*`); `star`: another word that matters after `\*` */
export declare const WORDS: Map<string, {
    fn: Fn;
    dest?: boolean;
    star?: boolean;
}>;
export {};
