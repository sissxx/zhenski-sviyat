import { isAuthorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily housekeeping (vercel.json → crons): run_maintenance marks bank-transfer memberships whose paid month
 * ended as expired, drops unpaid sign-ups and closes past events and consultations. Access itself already
 * stops at the end of the paid period; this keeps statuses and the admin's Viber to-do list tidy.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    console.error("cron maintenance: SUPABASE_SECRET_KEY is missing.");
    return new Response("Not configured", { status: 503 });
  }

  const { data, error } = await createAdminClient().rpc("run_maintenance");
  if (error) {
    console.error("cron maintenance failed", error);
    return new Response("Failed", { status: 500 });
  }
  return Response.json(data);
}
