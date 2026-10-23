/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { list: string[] };

/** One numbered section of a legal page. `id` is the anchor used by the table of contents. */
export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };
