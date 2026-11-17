import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** Events and consultations now share one profile page (Моите записвания). */
export default function AccountEventsPage() {
  redirect(`${routes.accountBookings}#sabitiya`);
}
