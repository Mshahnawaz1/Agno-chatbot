/**
 * A document's link target, or undefined when following it could run code: web, mail, phone and FTP links, and
 * relative or in-document (`#bookmark`) targets are kept. The scheme is read the way a browser reads it.
 */
export declare function safeHref(href: string | null | undefined): string | undefined;
