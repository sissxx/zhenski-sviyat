import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Промоция" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditPromotionPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  return (
    <EntityEditPage
      entity="promotion"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.title)}
      backLabel="Промоции"
      deleteConfirm="Промоцията ще бъде изтрита завинаги."
    />
  );
}
