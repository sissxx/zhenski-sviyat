/** Intl output uses non-breaking and narrow spaces; compare against plain spaces. */
export const plain = (text: string) => text.replace(/[  ]/g, " ");
