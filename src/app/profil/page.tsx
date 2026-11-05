import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

type AccountIndexProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The profile has no overview tab: /profil opens "Моите данни", keeping any query (e.g. ?potvarden=1). */
export default async function AccountIndex({ searchParams }: AccountIndexProps) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, v);
  }
  const qs = query.toString();
  redirect(qs ? `${routes.accountDetails}?${qs}` : routes.accountDetails);
}
