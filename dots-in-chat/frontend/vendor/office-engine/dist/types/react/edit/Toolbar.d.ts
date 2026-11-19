import { type CSSProperties, type ReactNode, type RefObject } from 'react';
declare const P: {
    undo: import("react").JSX.Element;
    redo: import("react").JSX.Element;
    bold: import("react").JSX.Element;
    italic: import("react").JSX.Element;
    underline: import("react").JSX.Element;
    strike: import("react").JSX.Element;
    color: import("react").JSX.Element;
    highlight: import("react").JSX.Element;
    fill: import("react").JSX.Element;
    alignLeft: import("react").JSX.Element;
    alignCenter: import("react").JSX.Element;
    alignRight: import("react").JSX.Element;
    justify: import("react").JSX.Element;
    bullets: import("react").JSX.Element;
    numbers: import("react").JSX.Element;
    indent: import("react").JSX.Element;
    outdent: import("react").JSX.Element;
    clear: import("react").JSX.Element;
    search: import("react").JSX.Element;
    save: import("react").JSX.Element;
    wrap: import("react").JSX.Element;
    edit: import("react").JSX.Element;
    view: import("react").JSX.Element;
    close: import("react").JSX.Element;
    image: import("react").JSX.Element;
    chart: import("react").JSX.Element;
    table: import("react").JSX.Element;
    link: import("react").JSX.Element;
    headerFooter: import("react").JSX.Element;
    track: import("react").JSX.Element;
    review: import("react").JSX.Element;
    pageSetup: import("react").JSX.Element;
    pagebreak: import("react").JSX.Element;
    sup: import("react").JSX.Element;
    sub: import("react").JSX.Element;
    lineSpacing: import("react").JSX.Element;
    plus: import("react").JSX.Element;
    minus: import("react").JSX.Element;
    fit: import("react").JSX.Element;
    shape: import("react").JSX.Element;
    textbox: import("react").JSX.Element;
    slideAdd: import("react").JSX.Element;
    copy: import("react").JSX.Element;
    trash: import("react").JSX.Element;
    play: import("react").JSX.Element;
    front: import("react").JSX.Element;
    back: import("react").JSX.Element;
    merge: import("react").JSX.Element;
    borders: import("react").JSX.Element;
    freeze: import("react").JSX.Element;
    sum: import("react").JSX.Element;
    rowAdd: import("react").JSX.Element;
    colAdd: import("react").JSX.Element;
    sort: import("react").JSX.Element;
    up: import("react").JSX.Element;
    down: import("react").JSX.Element;
    chevron: import("react").JSX.Element;
    lineWeight: import("react").JSX.Element;
    rotate: import("react").JSX.Element;
    rotateCcw: import("react").JSX.Element;
    flipH: import("react").JSX.Element;
    flipV: import("react").JSX.Element;
    alignObj: import("react").JSX.Element;
    currency: import("react").JSX.Element;
    vTop: import("react").JSX.Element;
    vMiddle: import("react").JSX.Element;
    vBottom: import("react").JSX.Element;
    rotNone: import("react").JSX.Element;
    rotUp: import("react").JSX.Element;
    rotDown: import("react").JSX.Element;
    rotStack: import("react").JSX.Element;
    rotUp90: import("react").JSX.Element;
    rotDown90: import("react").JSX.Element;
    sortAZ: import("react").JSX.Element;
    sortZA: import("react").JSX.Element;
    gridlines: import("react").JSX.Element;
    lineStyle: import("react").JSX.Element;
    paint: import("react").JSX.Element;
    styleMatch: import("react").JSX.Element;
    omega: import("react").JSX.Element;
    outline: import("react").JSX.Element;
    imgOrig: import("react").JSX.Element;
    imgReplace: import("react").JSX.Element;
    alt: import("react").JSX.Element;
    cut: import("react").JSX.Element;
    paste: import("react").JSX.Element;
    pastePlain: import("react").JSX.Element;
    external: import("react").JSX.Element;
    unlink: import("react").JSX.Element;
    selectAll: import("react").JSX.Element;
    hideShow: import("react").JSX.Element;
    percent: import("react").JSX.Element;
    decLess: import("react").JSX.Element;
    decMore: import("react").JSX.Element;
    check: import("react").JSX.Element;
    more: import("react").JSX.Element;
    bAll: import("react").JSX.Element;
    bOuter: import("react").JSX.Element;
    bInner: import("react").JSX.Element;
    bTop: import("react").JSX.Element;
    bBottom: import("react").JSX.Element;
    bLeft: import("react").JSX.Element;
    bRight: import("react").JSX.Element;
    bNone: import("react").JSX.Element;
    rect: import("react").JSX.Element;
    roundRect: import("react").JSX.Element;
    ellipse: import("react").JSX.Element;
    triangle: import("react").JSX.Element;
    arrow: import("react").JSX.Element;
    star: import("react").JSX.Element;
    line: import("react").JSX.Element;
    rowAbove: import("react").JSX.Element;
    rowBelow: import("react").JSX.Element;
    colLeft: import("react").JSX.Element;
    colRight: import("react").JSX.Element;
    delRow: import("react").JSX.Element;
    delCol: import("react").JSX.Element;
    hide: import("react").JSX.Element;
    file: import("react").JSX.Element;
    open: import("react").JSX.Element;
    print: import("react").JSX.Element;
    pdf: import("react").JSX.Element;
    html: import("react").JSX.Element;
    code: import("react").JSX.Element;
    doc: import("react").JSX.Element;
    slides: import("react").JSX.Element;
    info: import("react").JSX.Element;
    comment: import("react").JSX.Element;
    commentAdd: import("react").JSX.Element;
    zoomIn: import("react").JSX.Element;
    zoomOut: import("react").JSX.Element;
    present: import("react").JSX.Element;
    sheetAdd: import("react").JSX.Element;
    replace: import("react").JSX.Element;
};
/** the name of one of the viewer's icons */
export type IconName = keyof typeof P;
/** the names of the viewer's icons, for a host's own set (`<DocViewer icons>`) */
export declare const ICON_NAMES: IconName[];
/**
 * A host's icons: a map by name, or a resolver called for every icon. A missing entry, or a resolver
 * returning `undefined` / `null`, keeps the built-in icon. Host icons are sized by font-size (1em).
 */
export type Icons = Partial<Record<IconName, ReactNode>> | ((name: IconName, props: {
    size: number;
}) => ReactNode | undefined | null);
/** the host's icon for `name`, or `undefined` for the built-in one; `false` counts as none, as a resolver written `name === 'x' && <X />` returns it */
export declare function hostIcon(icons: Icons | undefined, name: IconName, size: number): ReactNode | undefined;
/**
 * Gives the views inside it the host's icons; DocViewer applies its `icons` prop through one.
 * Nested providers fall back to the enclosing one for names they leave out.
 */
export declare function IconsProvider({ icons, children }: {
    icons?: Icons;
    children?: ReactNode;
}): import("react").JSX.Element;
export declare function Icon({ name, size }: {
    name: IconName;
    size?: number;
}): import("react").JSX.Element;
/** closes a popup on outside mousedown (shadow-DOM safe: uses the composed path) */
export declare function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void): void;
export declare function Btn(props: {
    icon?: IconName;
    label?: ReactNode;
    title: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    wide?: boolean;
}): import("react").JSX.Element;
export declare const Sep: () => import("react").JSX.Element;
export interface DropOption<T> {
    value: T;
    label: string;
    /** secondary text on the right (example, shortcut) */
    hint?: string;
    icon?: IconName;
    /** label style (font / style previews) */
    style?: CSSProperties;
    disabled?: boolean;
    /** separator above this option */
    sep?: boolean;
    /** group heading above this option */
    head?: string;
}
/**
 * Styled dropdown (listbox). Never takes focus from the editor: mouse down is prevented and,
 * while open, keys are captured at the window (arrows, Enter, Escape, type-ahead).
 */
export declare function Dropdown<T extends string | number>(props: {
    title: string;
    options: DropOption<T>[];
    onChange: (v: T) => void;
    /** selected value (check mark); omit for command menus */
    value?: T | '';
    placeholder?: string;
    /** fixed trigger content (menus); null = icon only */
    label?: ReactNode;
    icon?: IconName;
    width?: number;
    menuWidth?: number;
    disabled?: boolean;
    /** popup aligned to the trigger's right edge */
    alignRight?: boolean;
    /** extra class of the trigger button */
    className?: string;
}): import("react").JSX.Element;
/** Value picker (fonts, styles, formats…). */
export declare function Select<T extends string | number>(props: {
    value: T | '';
    options: DropOption<T>[];
    onChange: (v: T) => void;
    title: string;
    width?: number;
    placeholder?: string;
    menuWidth?: number;
    disabled?: boolean;
}): import("react").JSX.Element;
/** Font size box: − [size] + with a list of common sizes (Google Docs style). */
export declare function SizeBox(props: {
    value?: number;
    placeholder?: number;
    sizes?: number[];
    onChange: (n: number) => void;
    title?: string;
    disabled?: boolean;
}): import("react").JSX.Element;
/**
 * One-line toolbar: items that do not fit move into a "more" popover (like Google Docs).
 * Item widths are measured once per set of items and cached for resizes.
 */
export declare function ToolbarRow({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function ColorBtn(props: {
    icon: IconName;
    title: string;
    value?: string;
    onPick: (c: string | null) => void;
    palette?: string[];
    noneLabel?: string;
}): import("react").JSX.Element;
export declare const FONTS: string[];
export declare const SIZES: number[];
/** Font picker options (each shown in its own face); keeps an unknown current font at the top. */
export declare function fontOptions(current?: string): DropOption<string>[];
/** Picks the first name of a CSS font stack. */
export declare function fontName(css: string | undefined): string;
export declare function download(blob: Blob, name: string): void;
/** Command menu: fixed label, items with optional icons. */
export declare function Menu(props: {
    title: string;
    label: string;
    icon?: IconName;
    items: {
        value: string;
        label: string;
        icon?: IconName;
        disabled?: boolean;
        sep?: boolean;
        hint?: string;
    }[];
    onPick: (v: string) => void;
    width?: number;
}): import("react").JSX.Element;
/** Small popover anchored under a toolbar button. */
export declare function Pop(props: {
    icon: IconName;
    title: string;
    children: (close: () => void) => ReactNode;
    active?: boolean;
    disabled?: boolean;
    chevron?: boolean;
}): import("react").JSX.Element;
/** rows × cols picker for new tables */
export declare function GridPicker({ onPick }: {
    onPick: (r: number, c: number) => void;
}): import("react").JSX.Element;
/** Inline text prompt (URL, sheet name…) inside a popover. */
export declare function PromptBox(props: {
    placeholder: string;
    initial?: string;
    ok: string;
    onOk: (v: string) => void;
    extra?: ReactNode;
}): import("react").JSX.Element;
/** Opens the OS file picker (images by default). */
export declare function pickFiles(accept?: string, multiple?: boolean): Promise<File[]>;
export {};
