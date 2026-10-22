import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Viber група" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditViberGroupPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  return (
    <EntityEditPage
      entity="viberGroup"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.name)}
      backLabel="Viber достъп"
      deleteConfirm="Групата, връзките ѝ с плановете и отбелязаните членове ще бъдат изтрити. Ако групата само временно не се използва, махни отметката „Активна“."
    />
  );
}
