import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Обява" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditAnnouncementPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  return (
    <EntityEditPage
      entity="announcement"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.title)}
      backLabel="Обяви"
      deleteConfirm="Обявата ще бъде изтрита завинаги."
    />
  );
}
