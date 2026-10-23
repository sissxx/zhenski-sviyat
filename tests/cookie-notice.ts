import { cookieNoticeStorageKey } from "../src/lib/legal";

/** Browser storage in which the visitor has already closed the cookie notice. */
export const cookieNoticeClosed = (origin: string) => ({
  cookies: [],
  origins: [{ origin, localStorage: [{ name: cookieNoticeStorageKey, value: "1" }] }],
});
