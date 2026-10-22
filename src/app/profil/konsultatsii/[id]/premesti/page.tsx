import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Typography from "@mui/material/Typography";
import { z } from "zod";
import { BookingFacts } from "@/components/consultations/BookingFacts";
import { RescheduleForm } from "@/components/consultations/RescheduleForm";
import { Panel } from "@/components/ui/Panel";
import { bookingActions, getBookingRules, getMyBooking } from "@/lib/consultations/queries";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Преместване на консултация" };

type ReschedulePageProps = { params: Promise<{ id: string }> };

export default async function ReschedulePage({ params }: ReschedulePageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) redirect(routes.accountConsultations);
  const [booking, rules] = await Promise.all([getMyBooking(id), getBookingRules()]);
  if (!booking?.service || !booking.specialist || !bookingActions(booking, rules).canReschedule) {
    redirect(routes.accountConsultations);
  }
  const left = rules.maxReschedules - booking.reschedule_count;

  return (
    <>
      <Panel tone="card" aria-labelledby="current-title" sx={{ gap: 1.25 }}>
        <Typography id="current-title" variant="h5" component="h2" sx={{ color: "primary.main" }}>
          {booking.service.name}: текущ час
        </Typography>
        <BookingFacts booking={booking} />
      </Panel>
      <Panel aria-labelledby="new-title" sx={{ gap: 1.5 }}>
        <Typography id="new-title" variant="h5" component="h2" sx={{ color: "primary.main" }}>
          Избери нов час
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {left === 1 ? "Това е последното позволено преместване за този час." : `Можеш да преместиш този час още ${left} пъти.`}
        </Typography>
        <RescheduleForm
          bookingId={booking.id}
          serviceId={booking.service.id}
          specialistId={booking.specialist.id}
          currentStartsAt={new Date(booking.starts_at).toISOString()}
        />
      </Panel>
    </>
  );
}
