/** JSON encoding that survives binary payloads (images inserted while collaborating). */
export declare function encode(value: unknown): string;
export declare function decode<T = unknown>(text: string): T;
