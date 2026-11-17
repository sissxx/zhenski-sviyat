import { buildIcs, icsResponse } from "@/lib/calendar/ics";
import { getMyBooking } from "@/lib/consultations/queries";
import { specialistLabel } from "@/lib/consultations/types";
import { routes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { site } from "@/lib/site";

/** "Добави в календара" for one of the signed-in member's own consultations (RLS hides everyone else's). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const booking = await getMyBooking(id);
  if (!booking || (booking.status !== "confirmed" && booking.status !== "pending_payment")) {
    return new Response("Not found", { status: 404 });
  }
  const url = absoluteUrl(routes.accountConsultations);
  const specialist = booking.specialist ? specialistLabel({ name: booking.specialist.full_name, title: booking.specialist.title }) : null;
  return icsResponse(
    buildIcs({
      uid: `consultation-${booking.id}@zhenski-sviyat`,
      title: `${booking.service?.name ?? "Консултация"}${specialist ? ` · ${specialist}` : ""} · ${site.shortName}`,
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      location: booking.service?.location_info ?? null,
      description: ["Промени или откажи часа от профила си:", url].join("\n"),
      url,
    }),
    "konsultatsiya",
  );
}
