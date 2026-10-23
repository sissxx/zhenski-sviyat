import { notFound } from "next/navigation";
import { isSharePageKey, sharePages } from "@/lib/seo/pages";
import { renderShareImage } from "@/lib/seo/share-image";

/** Share images of the public pages, built once at deploy time. */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(sharePages).map((page) => ({ page }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page: key } = await params;
  if (!isSharePageKey(key)) notFound();
  const page = sharePages[key];
  return renderShareImage({
    eyebrow: page.eyebrow,
    title: "imageTitle" in page ? page.imageTitle : page.title,
    text: page.description,
  });
}
