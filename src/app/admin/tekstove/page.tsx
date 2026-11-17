import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SiteTextsForm } from "@/components/admin/SiteTextsForm";
import { editableTexts } from "@/content/editable-texts";
import { requireAdminPage } from "@/lib/admin/session";
import { blockText } from "@/lib/content/texts";

export const metadata: Metadata = { title: "Текстове на сайта" };

export default async function AdminTextsPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("content_blocks").select("key, value");
  const saved = new Map((data ?? []).map((row) => [row.key, blockText(row.value)]));
  const values = Object.fromEntries(editableTexts.map((t) => [t.key, saved.get(t.key) ?? t.defaultValue]));

  return (
    <>
      <AdminPageHeader
        title="Текстове на сайта"
        description="Текстовете на началната страница, „За нас“ и „Контакти“. Промените се виждат на сайта веднага след запис. Ако изтриеш текст, се връща първоначалният."
      />
      <SiteTextsForm initialValues={values} />
    </>
  );
}
