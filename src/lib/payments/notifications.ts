import "server-only";

/**
 * Hooks for payment emails (Brevo, spec section 11). Each is called once a payment change has been
 * stored, from the Stripe webhook or the return from Checkout. They may run more than once for the same
 * payment (webhook retries), so a real sender should check email_log before sending.
 *
 * They do nothing yet: the Brevo integration fills them in. They must never throw into the caller,
 * because a failed email must not make Stripe retry an already recorded payment.
 */

/** A card payment for an event registration or consultation booking succeeded. */
export async function paymentSucceeded(paymentId: string): Promise<void> {
  void paymentId;
}

/** A Checkout Session expired or a card payment failed; the seat or slot was released. */
export async function paymentFailed(paymentId: string): Promise<void> {
  void paymentId;
}

/** A plan renewal by card failed (invoice.payment_failed). Stripe retries; the member should update the card. */
export async function subscriptionPaymentFailed(subscriptionId: string): Promise<void> {
  void subscriptionId;
}
