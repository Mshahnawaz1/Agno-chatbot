export type Zoom = number | 'fit';
export declare function ZoomControl({ zoom, effective, onChange }: {
    zoom: Zoom;
    effective: number;
    onChange: (z: Zoom) => void;
}): import("react").JSX.Element;
