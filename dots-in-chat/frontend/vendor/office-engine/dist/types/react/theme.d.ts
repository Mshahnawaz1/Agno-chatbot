import type { CSSProperties } from 'react';
import { type ThemeMode } from './common/hooks';
export type { ThemeMode };
/**
 * Every design token of the viewer, as named in the stylesheet without its `--de-` prefix. The stylesheet defines each
 * on `.de-root` (light) and the colors again on `.de-root.de-dark`; `test/theme.test.ts` keeps this list and the
 * stylesheet in step.
 */
export declare const THEME_TOKENS: readonly ['bg', 'chrome', 'border', 'text', 'muted', 'accent', 'accent-hover', 'accent-ink', 'accent-soft', 'on', 'on-ink', 'on-ink-strong', 'ink', 'ink-strong', 'ink-soft', 'hover', 'hover-solid', 'hover-soft', 'ebar', 'tb-sep', 'pop', 'pop-shadow', 'sep', 'input-bg', 'input-border', 'swatch-border', 'disabled', 'danger', 'danger-border', 'ok', 'tab-hover', 'tab-on', 'tab-ink', 'toast-bg', 'toast-ink', 'backdrop', 'shadow', 'grid', 'head', 'head-ink', 'head-border', 'corner-border', 'freeze', 'cm-bg', 'cm-on', 'cm-line', 'cm-line-on', 'cm-card', 'cm-quote', 'font', 'font-mono', 'font-size', 'radius-sm', 'radius', 'radius-lg', 'radius-xl', 'shadow-sm', 'shadow-md', 'shadow-lg', 'kind-docx', 'kind-xlsx', 'kind-pptx', 'kind-ink', 'avatar-ink', 'find', 'find-on', 'find-cell', 'find-cell-on', 'find-cell-line', 'tip-bg', 'tip-ink', 'present-bg', 'present-ink', 'status-idle', 'status-live', 'status-busy', 'status-error', 'page', 'page-ink', 'sheet-ink', 'skeleton', 'ph-border', 'ph-a', 'ph-b', 'ph-ink', 'ph-outline', 'ph-hint', 'src-bg', 'src-gutter', 'src-sel', 'src-font', 'src-comment', 'src-keyword', 'src-string', 'src-operator', 'src-number', 'src-heading', 'src-attr', 'src-tag', 'src-meta'];
export type ThemeToken = (typeof THEME_TOKENS)[number];
type Camel<S extends string> = S extends `${infer H}-${infer T}` ? `${H}${Capitalize<Camel<T>>}` : S;
/** Token values by camelCase name (`accentHover` for `--de-accent-hover`); any CSS value, `var()` included. */
export type ThemeTokens = {
    [K in ThemeToken as Camel<K>]?: string;
};
export interface ThemeOptions {
    /** Light, dark, or following the OS. Default 'light'. */
    mode?: ThemeMode;
    /** Tokens for both modes: type, shape, a brand accent that works on both. */
    tokens?: ThemeTokens;
    /** Tokens for the light mode only, over `tokens`. */
    light?: ThemeTokens;
    /** Tokens for the dark mode only, over `tokens`. */
    dark?: ThemeTokens;
}
/** The `theme` prop: a mode, or a mode with token overrides. */
export type Theme = ThemeMode | ThemeOptions;
/** Types a theme object (no runtime work: for editor completion where the object is written apart from the prop). */
export declare const createTheme: (theme: ThemeOptions) => ThemeOptions;
export declare const themeMode: (theme: Theme | undefined) => ThemeMode;
/** The custom properties a theme sets on the viewer root in the given mode. */
export declare function themeStyle(theme: Theme | undefined, dark: boolean): CSSProperties;
/**
 * The class name and style of a viewer root for `theme`: what `DocViewer` puts on its root element, for hosts that
 * mount the views (`DocxView`, `XlsxView`, `PptxView`) in a root of their own.
 */
export declare function useThemeRoot(theme?: Theme, style?: CSSProperties): {
    className: string;
    style: CSSProperties;
    dark: boolean;
};
