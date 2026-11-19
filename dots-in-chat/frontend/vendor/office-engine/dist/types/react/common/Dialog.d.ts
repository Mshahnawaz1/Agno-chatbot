import { type ReactNode } from 'react';
export interface PromptSpec {
    title: string;
    label?: string;
    initial?: string;
    placeholder?: string;
    ok?: string;
    /** multi-line input */
    area?: boolean;
    onOk: (value: string) => void;
    /** extra button (e.g. "Remove link") */
    extra?: {
        label: string;
        run: () => void;
    };
    note?: ReactNode;
}
/** Small modal prompt (no window.prompt: works in sandboxed / embedded pages). */
export declare function PromptDialog({ spec, onClose }: {
    spec: PromptSpec;
    onClose: () => void;
}): import("react").JSX.Element;
/** Yes / no question (no window.confirm: works in sandboxed / embedded pages). */
export declare function ConfirmDialog(props: {
    title: string;
    message: ReactNode;
    ok: string;
    onOk: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
/** Short-lived message at the bottom of the viewer. */
export declare function Toast({ text, onDone }: {
    text: string;
    onDone: () => void;
}): import("react").JSX.Element;
