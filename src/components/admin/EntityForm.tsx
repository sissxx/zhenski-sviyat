"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { Panel } from "@/components/ui/Panel";
import { saveEntity, saveSettings } from "@/lib/admin/actions";
import { slugify, type FormValues } from "@/lib/admin/convert";
import { entityForms, type EntityKey, type FieldConfig } from "@/lib/admin/forms";
import { itemPath } from "@/lib/admin/routes";
import { ImageField } from "./ImageField";

type EntityFormProps = {
  entity: EntityKey;
  /** Null for a new item. */
  id: string | null;
  defaultValues: FormValues;
  /** List the item belongs to: a new item opens at `<listPath>/<id>` after saving. */
  listPath?: string;
  submitLabel?: string;
};

const inputType: Partial<Record<FieldConfig["type"], string>> = {
  datetime: "datetime-local",
  date: "date",
  email: "email",
  url: "url",
};

const inputMode: Partial<Record<FieldConfig["type"], "numeric" | "decimal">> = { number: "numeric", money: "decimal" };

/** Editor for one admin item, built from its definition in src/lib/admin/forms.ts. */
export function EntityForm({ entity, id, defaultValues, listPath, submitLabel }: EntityFormProps) {
  const router = useRouter();
  const config = entityForms[entity];
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getFieldState,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(config.schema) as unknown as Resolver<FormValues>,
    defaultValues,
  });

  // Suggest the slug from the title while creating, until the admin edits the slug by hand.
  const slugField = config.sections.flatMap((s) => s.fields).find((f) => f.type === "slug");
  const slugSource = useWatch({ control, name: slugField?.slugFrom ?? "__none" });
  useEffect(() => {
    if (!slugField || id || typeof slugSource !== "string") return;
    if (getFieldState(slugField.name).isDirty && getFieldState(slugField.name).isTouched) return;
    setValue(slugField.name, slugify(slugSource), { shouldValidate: false });
  }, [slugSource, slugField, id, getFieldState, setValue]);

  const onSubmit = async (values: FormValues) => {
    setResult(null);
    const response = entity === "settings" ? await saveSettings(values) : await saveEntity(entity, id, values);
    if (!response.ok) return setResult({ ok: false, message: response.error });
    if (!id && listPath && response.id) {
      router.push(itemPath(listPath, response.id) + "?zapazeno=1");
      return;
    }
    reset(values);
    setResult({ ok: true, message: "Промените са запазени." });
    router.refresh();
  };

  const renderField = (field: FieldConfig) => {
    const error = errors[field.name] as { message?: string } | undefined;
    const fieldError = error?.message ? { type: "validate", message: error.message } : undefined;
    const span = field.span ?? 6;
    const gridColumn = { xs: "1 / -1", sm: `span ${span}` };

    if (field.type === "checkbox") {
      return (
        <Box key={field.name} sx={{ gridColumn: "1 / -1" }}>
          <Controller
            name={field.name}
            control={control}
            render={({ field: { value, onChange, ref, ...rest } }) => (
              <FormControlLabel
                control={<Checkbox checked={value === true} onChange={(e) => onChange(e.target.checked)} slotProps={{ input: { ref } }} {...rest} />}
                label={field.label}
                slotProps={{ typography: { variant: "body2" } }}
              />
            )}
          />
          {field.helperText && (
            <Typography variant="caption" sx={{ display: "block", ml: 4, mt: -0.5 }}>
              {field.helperText}
            </Typography>
          )}
        </Box>
      );
    }

    if (field.type === "image") {
      return (
        <Box key={field.name} sx={{ gridColumn }}>
          <Controller
            name={field.name}
            control={control}
            render={({ field: { value, onChange } }) => (
              <ImageField
                id={`field-${field.name}`}
                label={field.label}
                folder={field.folder ?? "misc"}
                value={typeof value === "string" ? value : ""}
                onChange={(path) => onChange(path)}
                helperText={field.helperText}
              />
            )}
          />
        </Box>
      );
    }

    if (field.type === "select") {
      return (
        <Box key={field.name} sx={{ gridColumn }}>
          <Controller
            name={field.name}
            control={control}
            render={({ field: { ref, value, ...rest } }) => (
              <FormTextField
                select
                label={field.label}
                helperText={field.helperText}
                error={fieldError}
                value={value ?? ""}
                registration={{ ...rest, ref, name: field.name, onChange: async (e) => rest.onChange(e), onBlur: async () => rest.onBlur() }}
              >
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </FormTextField>
            )}
          />
        </Box>
      );
    }

    const multiline = field.type === "textarea" || field.type === "lines";
    return (
      <Box key={field.name} sx={{ gridColumn }}>
        <FormTextField
          label={field.label}
          type={inputType[field.type] ?? "text"}
          multiline={multiline}
          minRows={multiline ? 4 : undefined}
          helperText={field.helperText}
          error={fieldError}
          registration={register(field.name)}
          slotProps={{
            htmlInput: { inputMode: inputMode[field.type] },
            inputLabel: field.type === "datetime" || field.type === "date" ? { shrink: true } : undefined,
          }}
        />
      </Box>
    );
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {config.sections.map((section, index) => (
        <Panel key={section.title ?? index} sx={{ alignItems: "stretch", gap: 2 }}>
          {section.title && (
            <Box>
              <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
                {section.title}
              </Typography>
              {section.description && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                  {section.description}
                </Typography>
              )}
            </Box>
          )}
          <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(6, minmax(0, 1fr))" } }}>
            {section.fields.map(renderField)}
          </Box>
        </Panel>
      ))}
      {Object.keys(errors).length > 0 && <FormAlert severity="error">Има грешки в някои полета. Провери отбелязаните.</FormAlert>}
      {result && <FormAlert severity={result.ok ? "success" : "error"}>{result.message}</FormAlert>}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button type="submit" variant="contained" disabled={isSubmitting || (Boolean(id) && !isDirty)}>
          {isSubmitting ? "Запазване…" : (submitLabel ?? (id ? "Запази промените" : "Създай"))}
        </Button>
      </Box>
    </Box>
  );
}
