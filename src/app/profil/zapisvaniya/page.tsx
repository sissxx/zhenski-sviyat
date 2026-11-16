import type { Metadata } from "next";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { MyConsultations } from "@/components/account/MyConsultations";
import { MyEvents } from "@/components/account/MyEvents";

export const metadata: Metadata = { title: "Моите записвания" };

type AccountBookingsProps = { searchParams: Promise<{ premestena?: string }> };

/** Everything the member signed up for in one place: events first, then consultations. */
export default async function AccountBookingsPage({ searchParams }: AccountBookingsProps) {
  const { premestena } = await searchParams;
  return (
    <>
      <AccountSectionHeader title="Моите записвания">
        Събитията и консултациите, за които си записана, и плащането за тях. Оттук ги местиш или отказваш.
      </AccountSectionHeader>
      <MyEvents />
      <MyConsultations moved={!!premestena} />
    </>
  );
}
