import type { Metadata } from "next";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AccountNav } from "@/components/account/AccountNav";
import { FormAlert } from "@/components/forms/FormAlert";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { signOut } from "@/lib/auth/actions";
import { isCurrentUserAdmin } from "@/lib/admin/session";
import { requireUser } from "@/lib/auth/session";
import { getMySpecialist } from "@/lib/specialist/session";
import { routes, specialistNavItem } from "@/lib/routes";

export const metadata: Metadata = {
  title: { default: "Моят профил", template: "%s · Моят профил" },
  robots: { index: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireUser();
  const name = profile?.first_name || user.email;
  const [isAdmin, specialist] = await Promise.all([isCurrentUserAdmin(), getMySpecialist()]);

  return (
    <>
      <PageIntro eyebrow="Моят профил" title={`Здравей, ${name}!`}>
        {isAdmin && (
          <Button variant="contained" href={routes.admin} sx={{ mt: 2, mr: 1.5 }}>
            Администрация
          </Button>
        )}
        <Box component="form" action={signOut} sx={{ display: { xs: "block", md: "none" }, mt: 2 }}>
          <Button type="submit" variant="outlined" size="small">
            Изход
          </Button>
        </Box>
      </PageIntro>
      <Section bg="brand.mintLight" sx={{ py: { xs: 3, md: 6 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: 4 },
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "240px minmax(0, 1fr)" },
            alignItems: "start",
          }}
        >
          <AccountNav extraItems={specialist ? [specialistNavItem] : []} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}>
            {profile?.status === "suspended" && (
              <FormAlert severity="warning">
                Профилът ти е временно спрян и не можеш да се записваш за събития и консултации. Свържи се с нас за
                повече информация.
              </FormAlert>
            )}
            {children}
          </Box>
        </Box>
      </Section>
    </>
  );
}
