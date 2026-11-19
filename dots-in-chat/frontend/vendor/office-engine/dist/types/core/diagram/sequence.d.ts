/**
 * Sequence diagrams (Mermaid sequenceDiagram, PlantUML): participants across, messages down, with activations,
 * notes, fragments (loop / alt / opt / par…), dividers and delays.
 */
import type { Rendered } from './graph';
export type PKind = 'participant' | 'actor' | 'database' | 'boundary' | 'control' | 'entity' | 'collections' | 'queue';
export interface Participant {
    id: string;
    label: string;
    kind: PKind;
    fill?: string;
    /** index in `Sequence.boxes` of the group box it is declared in */
    box?: number;
}
export interface SeqBox {
    label: string;
    fill?: string;
}
export type MsgHead = 'filled' | 'open' | 'cross' | 'half' | 'none';
export type SeqEvent = {
    t: 'msg';
    from: string;
    to: string;
    text: string;
    dashed: boolean;
    head: MsgHead;
    both?: boolean;
    activate?: boolean;
    deactivate?: boolean;
} | {
    t: 'act';
    who: string;
    on: boolean;
} | {
    t: 'note';
    pos: 'left' | 'right' | 'over';
    who: string[];
    text: string;
} | {
    t: 'block';
    kind: string;
    label: string;
    fill?: string;
} | {
    t: 'else';
    label: string;
} | {
    t: 'end';
} | {
    t: 'divider';
    text: string;
} | {
    t: 'delay';
    text: string;
} | {
    t: 'space';
    h: number;
} | {
    t: 'destroy';
    who: string;
};
export interface Sequence {
    title?: string;
    participants: Participant[];
    events: SeqEvent[];
    autonumber?: boolean;
    /** participants drawn again at the bottom (default true) */
    footer?: boolean;
    /** Mermaid `box … end` groups of participants */
    boxes?: SeqBox[];
}
export declare class SequenceBuilder {
    readonly s: Sequence;
    private ids;
    private open?;
    /** participants first declared until `endBox` belong to the box */
    beginBox(label: string, fill?: string): void;
    endBox(): void;
    participant(id: string, patch?: Partial<Participant>): Participant;
    has(id: string): boolean;
    push(e: SeqEvent): void;
}
export declare function renderSequence(s: Sequence): Rendered;
