/**
 * The association's legal details, shown on the privacy, terms and cookie pages. A null value is shown
 * as "Предстои" (see Placeholder) until the association provides it; check `data-placeholder` before launch.
 */
export const legalEntity = {
  /** Registered name as in the Bulgarian Business Register (Търговски регистър и регистър на ЮЛНЦ). */
  registeredName: "Сдружение „Женски свят“",
  /** ЕИК / БУЛСТАТ. */
  eik: null as string | null,
  /** Seat and registered address. */
  address: null as string | null,
  /** Address for privacy requests and complaints. */
  email: null as string | null,
  phone: null as string | null,
  /** Person who represents the association (председател). */
  representative: null as string | null,
} as const;

/** Date the current texts take effect, shown at the top of each document. Change it with every edit. */
export const legalUpdatedAt = "2026-10-23";

/**
 * True once a lawyer has reviewed the texts. Until then each document shows a "draft" notice.
 */
export const legalTextsReviewed = false;

/** localStorage key that remembers the visitor closed the cookie notice. */
export const cookieNoticeStorageKey = "zs-cookie-notice";
