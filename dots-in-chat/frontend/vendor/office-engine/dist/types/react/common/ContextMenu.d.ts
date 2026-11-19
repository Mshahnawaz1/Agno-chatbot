import { type IconName } from '../edit/Toolbar';
export interface MenuItem {
    label: string;
    /** what picking the item does (an item with `items` opens them instead) */
    run?: () => void;
    disabled?: boolean;
    /** separator above this item */
    sep?: boolean;
    /** shortcut / secondary text */
    hint?: string;
    icon?: IconName;
    /** small section title above this item */
    head?: string;
    /** submenu: the item opens these beside it */
    items?: MenuItem[];
}
/** Right-click menu at viewport coordinates; never steals focus from the editor. */
export declare function ContextMenu({ x, y, items, onClose }: {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
}): import("react").JSX.Element;
/** platform modifier label for shortcut hints */
export declare const MOD: string;
