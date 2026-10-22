import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Въпрос" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditFaqPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  return (
    <EntityEditPage
      entity="faq"
      id={id}
      saved={Boolean(zapazeno)}
      title={() => "Въпрос"}
      backLabel="Въпроси"
      deleteConfirm="Въпросът ще бъде изтрит завинаги. Ако само искаш да го скриеш, махни отметката „Публикувано“."
    />
  );
}
