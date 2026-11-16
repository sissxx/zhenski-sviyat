"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { Panel } from "@/components/ui/Panel";
import { editableGroups } from "@/content/editable-texts";
import { saveSiteTexts } from "@/lib/admin/actions";

/** One panel per page with its texts; a single save button writes only what changed. */
export function SiteTextsForm({ initialValues }: { initialValues: Record<string, string> }) {
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(initialValues);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = Object.keys(values).filter((key) => values[key] !== saved[key]);

  const save = () => {
    setResult(null);
    const payload = Object.fromEntries(changed.map((key) => [key, values[key]]));
    startTransition(async () => {
      const response = await saveSiteTexts(payload);
      if (response.ok) {
        setSaved(values);
        setResult({ ok: true, message: "Записано. Промените вече са на сайта." });
      } else {
        setResult({ ok: false, message: response.error });
      }
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {editableGroups.map((group) => (
        <Panel key={group.title} aria-label={group.title} sx={{ p: { xs: 2.5, md: 3.5 }, gap: 2 }}>
          <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
            {group.title}
          </Typography>
          {group.texts.map((text) => (
            <TextField
              key={text.key}
              label={text.label}
              value={values[text.key] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [text.key]: event.target.value }))}
              multiline={text.multiline}
              minRows={text.multiline ? 2 : undefined}
              helperText={text.helperText}
              fullWidth
            />
          ))}
        </Panel>
      ))}
      {result && <FormAlert severity={result.ok ? "success" : "error"}>{result.message}</FormAlert>}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          py: 1.5,
          bgcolor: "background.default",
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Button variant="contained" onClick={save} disabled={pending || changed.length === 0}>
          {pending ? "Записване…" : "Запиши промените"}
        </Button>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {changed.length === 0 ? "Няма незаписани промени." : `Незаписани промени: ${changed.length}`}
        </Typography>
      </Box>
    </Box>
  );
}
