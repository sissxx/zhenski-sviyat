import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Партньор" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditPartnerPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  return (
    <EntityEditPage
      entity="partner"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.name)}
      backLabel="Партньори"
      deleteConfirm="Партньорът ще бъде изтрит завинаги."
    />
  );
}
