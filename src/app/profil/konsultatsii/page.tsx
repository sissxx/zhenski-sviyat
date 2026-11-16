import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

type Props = { searchParams: Promise<{ premestena?: string }> };

/** Events and consultations now share one profile page (Моите записвания); moving and calendar files stay under this path. */
export default async function AccountConsultationsPage({ searchParams }: Props) {
  const { premestena } = await searchParams;
  redirect(`${routes.accountBookings}${premestena ? "?premestena=1" : ""}#konsultatsii`);
}
