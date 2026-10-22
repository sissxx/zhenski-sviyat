import { supabaseUrl } from "./env";

/** Public URL of an image in the `media` bucket (event covers, photos, logos), from its stored path. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${supabaseUrl()}/storage/v1/object/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}
