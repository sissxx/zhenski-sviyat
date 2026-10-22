import { consultationConfirmationPath, eventConfirmationPath } from "@/lib/routes";

export const cardUnavailable =
  "Плащането с карта не може да започне в момента. Опитай отново след малко или избери банков превод.";

export type CheckoutTarget = { eventSlug: string; registrationId: string } | { bookingId: string };

/** The confirmation page for an event registration or consultation booking. */
export function confirmationPathFor(target: CheckoutTarget): string {
  return "bookingId" in target
    ? consultationConfirmationPath(target.bookingId)
    : `${eventConfirmationPath(target.eventSlug)}?zapisvane=${target.registrationId}`;
}

/** Where Stripe Checkout sends the user back: the confirmation page, with the session or a cancel flag. */
export function checkoutReturnPaths(target: CheckoutTarget) {
  const base = confirmationPathFor(target);
  return { successPath: `${base}&session_id={CHECKOUT_SESSION_ID}`, cancelPath: `${base}&plashtane=prekasnato` };
}
