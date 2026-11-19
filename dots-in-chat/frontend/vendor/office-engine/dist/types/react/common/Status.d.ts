/** Toolbar slot provided by DocViewer; views portal their status text into it (no parent re-render). */
export declare const StatusContext: import("react").Context<HTMLElement | null>;
export declare function Status({ text, onStatus }: {
    text: string;
    onStatus?: (s: string) => void;
}): import("react").ReactPortal | null;
