import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { startPaymentCheckout } from "@/lib/stripe/checkout";
import { cardUnavailable, checkoutReturnPaths, confirmationPathFor, type CheckoutTarget } from "./paths";

/**
 * Redirects to Checkout for the payment, or to the confirmation page when there is nothing to pay
 * by card (already paid, expired, or a bank transfer). Returns only on a Stripe error.
 * Not a server action: callers pass the signed-in user's id.
 */
export async function redirectToCheckout(paymentId: string, userId: string, target: CheckoutTarget): Promise<{ ok: false; error: string }> {
  let url: string;
  try {
    const result = await startPaymentCheckout({ paymentId, userId, ...checkoutReturnPaths(target) });
    url = result.kind === "redirect" ? result.url : confirmationPathFor(target);
  } catch (error) {
    unstable_rethrow(error);
    console.error("redirectToCheckout", error);
    return { ok: false, error: cardUnavailable };
  }
  redirect(url);
}
