/**
 * Views register their live editing objects here so a collaboration session
 * (created independently, e.g. by DocViewer) can reach them. Tiny on purpose:
 * views import only this file.
 */
/** registers `host` for (client, kind); returns the unregister function */
export declare function registerHost<T>(client: object, kind: string, host: T): () => void;
export declare function getHost<T>(client: object, kind: string): T | undefined;
/** calls `fn` with the current host and every host registered later */
export declare function watchHost<T>(client: object, kind: string, fn: (host: T) => void): () => void;
export interface PeerView {
    site: number;
    name: string;
    color: string;
    presence?: unknown;
}
/** session → views: collaborators and where they are */
export declare function setPeers(client: object, peers: PeerView[]): void;
/** stable between changes (usable as a useSyncExternalStore snapshot) */
export declare function getPeers(client: object): PeerView[];
export declare function subscribePeers(client: object, fn: () => void): () => void;
/** views → session: the local user's position (selection, active slide…) */
export declare function publishLocal(client: object, data: unknown): void;
export declare function onLocal(client: object, fn: (data: unknown) => void): () => void;
