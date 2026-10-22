"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/client";
import { mediaUrl } from "@/lib/supabase/media";

const maxBytes = 10 * 1024 * 1024;
const accepted = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];

type ImageFieldProps = {
  id: string;
  label: string;
  folder: string;
  value: string;
  onChange: (path: string) => void;
  helperText?: string;
};

/**
 * Uploads an image straight from the browser to the public `media` bucket and stores its path.
 * Storage policies only let admins upload, so this works only for a signed-in admin.
 */
export function ImageField({ id, label, folder, value, onChange, helperText }: ImageFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = mediaUrl(value);

  const upload = async (file: File) => {
    setError(null);
    if (!accepted.includes(file.type)) return setError("Позволени са JPG, PNG, WebP, AVIF и SVG.");
    if (file.size > maxBytes) return setError("Файлът е над 10 MB.");
    setBusy(true);
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await createClient().storage.from("media").upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
    setBusy(false);
    if (uploadError) return setError("Снимката не се качи. Опитай отново.");
    onChange(path);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography component="label" htmlFor={id} sx={{ fontWeight: 600, fontSize: 14, color: "primary.main" }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        {url ? (
          <Box
            component="img"
            src={url}
            alt=""
            sx={{ width: 160, height: 100, objectFit: "cover", borderRadius: "10px", border: "1px solid", borderColor: "divider" }}
          />
        ) : (
          <Box
            sx={{
              width: 160,
              height: 100,
              borderRadius: "10px",
              border: "1px dashed",
              borderColor: "divider",
              display: "grid",
              placeItems: "center",
              color: "text.secondary",
              fontSize: 13,
            }}
          >
            Няма снимка
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" size="small" disabled={busy} onClick={() => input.current?.click()} sx={{ minWidth: 0 }}>
            {busy ? "Качване…" : url ? "Смени" : "Качи снимка"}
          </Button>
          {url && (
            <Button size="small" color="error" onClick={() => onChange("")} sx={{ minWidth: 0 }}>
              Премахни
            </Button>
          )}
        </Box>
        <input
          ref={input}
          id={id}
          type="file"
          accept={accepted.join(",")}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </Box>
      {(error || helperText) && (
        <Typography variant="caption" sx={{ color: error ? "error.main" : "text.secondary" }} role={error ? "alert" : undefined}>
          {error ?? helperText}
        </Typography>
      )}
    </Box>
  );
}
