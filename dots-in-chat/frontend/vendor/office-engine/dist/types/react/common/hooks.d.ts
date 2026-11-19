import { useLayoutEffect } from 'react';
import type { DocumentClient } from '../../core/worker/client';
export declare const useIsoLayoutEffect: typeof useLayoutEffect;
/** Color scheme of the viewer chrome: 'auto' follows the browser / OS setting (prefers-color-scheme). */
export type ThemeMode = 'light' | 'dark' | 'auto';
/** Whether the dark theme applies for `theme`; 'auto' tracks prefers-color-scheme live. */
export declare function useDarkTheme(theme?: ThemeMode): boolean;
export declare function useForceUpdate(): [number, () => void];
/** Element size via ResizeObserver. */
export declare function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, {
    w: number;
    h: number;
}];
/** Scroll position of an element, batched to animation frames. Follows the element when it mounts after the first render. */
export declare function useScroll(ref: React.RefObject<HTMLElement | null>): {
    x: number;
    y: number;
};
/** Lazily resolves a package part to an object URL (null while loading / unsupported). */
export declare function useMediaUrl(client: DocumentClient, path: string | undefined, enabled?: boolean): string | null | 'unsupported';
/** Binary search: last index i with arr[i] <= v. */
export declare function lowerIndex(arr: ArrayLike<number>, v: number): number;
export declare function useLatest<T>(v: T): import("react").RefObject<T>;
export declare function useStableCallback<A extends unknown[], R>(fn: (...a: A) => R): (...a: A) => R;
/** A control that takes typed text: Ctrl/⌘+A selects its own content. */
export declare function isTextEntry(target: EventTarget | null): boolean;
/**
 * Focuses `el` so keyboard shortcuts work without a click. The focus stays where it is when a control
 * outside the viewer has it (a host page form); the viewer's own chrome (or the page body) yields.
 */
export declare function claimFocus(el: HTMLElement | null): boolean;
