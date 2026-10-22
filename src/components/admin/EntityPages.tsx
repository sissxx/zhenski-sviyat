import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import { FormAlert } from "@/components/forms/FormAlert";
import { deleteEntity } from "@/lib/admin/actions";
import { entities, loadEntityForm } from "@/lib/admin/entities";
import type { EntityKey } from "@/lib/admin/forms";
import { requireAdminPage } from "@/lib/admin/session";
import { ActionButton } from "./ActionButton";
import { AdminPageHeader } from "./AdminPageHeader";
import { EntityForm } from "./EntityForm";

type Key = Exclude<EntityKey, "settings">;

/** "New item" page for any admin list. */
export async function EntityNewPage({ entity, title, backLabel }: { entity: Key; title: string; backLabel: string }) {
  await requireAdminPage();
  const config = entities[entity];
  return (
    <>
      <AdminPageHeader title={title} back={{ label: backLabel, href: config.listPath }} />
      <EntityForm entity={entity} id={null} defaultValues={config.defaults} listPath={config.listPath} />
    </>
  );
}

type EntityEditPageProps = {
  entity: Key;
  id: string;
  title: (values: Record<string, unknown>) => string;
  backLabel: string;
  saved?: boolean;
  /** Ask before deleting. Leave out to hide the delete button (e.g. events with registrations). */
  deleteConfirm?: string;
  /** Extra links or buttons next to the title. */
  actions?: ReactNode;
  /** Extra panels under the form (schedules, linked groups…). */
  children?: ReactNode;
};

/** "Edit item" page for any admin list: the form, an optional delete button and extra panels. */
export async function EntityEditPage({ entity, id, title, backLabel, saved, deleteConfirm, actions, children }: EntityEditPageProps) {
  const { supabase } = await requireAdminPage();
  const config = entities[entity];
  const values = /^[0-9a-f-]{36}$/i.test(id) ? await loadEntityForm(supabase, entity, id) : null;
  if (!values) notFound();

  return (
    <>
      <AdminPageHeader title={title(values)} back={{ label: backLabel, href: config.listPath }}>
        {(actions || deleteConfirm) && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {actions}
            {deleteConfirm && (
              <ActionButton
                label="Изтрий"
                color="error"
                confirm={deleteConfirm}
                confirmLabel="Изтрий"
                action={deleteEntity.bind(null, entity, id)}
                redirectTo={config.listPath}
                successMessage="Изтрито."
              />
            )}
          </Box>
        )}
      </AdminPageHeader>
      {saved && <FormAlert severity="success">Записано.</FormAlert>}
      <EntityForm entity={entity} id={id} defaultValues={values} listPath={config.listPath} />
      {children}
    </>
  );
}
