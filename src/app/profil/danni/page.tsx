import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { ProfileForm } from "@/components/account/ProfileForm";
import { FormAlert } from "@/components/forms/FormAlert";
import { Panel } from "@/components/ui/Panel";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/locale";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Моите данни" };

type AccountDetailsProps = { searchParams: Promise<{ potvarden?: string; parola?: string }> };

/** The first page of the profile: after login, sign-up and email confirmation the member lands here. */
export default async function AccountDetailsPage({ searchParams }: AccountDetailsProps) {
  const [{ user, profile }, { potvarden, parola }] = await Promise.all([requireUser(), searchParams]);

  return (
    <>
      {potvarden && <FormAlert severity="success">Имейлът ти е потвърден. Добре дошла в общността!</FormAlert>}
      {parola === "promenena" && <FormAlert severity="success">Паролата ти е сменена.</FormAlert>}
      <AccountSectionHeader title="Моите данни">Името и телефона ти, имейлите от нас и паролата за вход.</AccountSectionHeader>
      <Panel aria-labelledby="details-title" sx={{ p: { xs: 2.5, md: 3.5 }, gap: 2.25, alignItems: "stretch" }}>
        <Typography id="details-title" variant="h5" component="h3" sx={{ color: "primary.main" }}>
          Лични данни
        </Typography>
        <ProfileForm
          email={user.email ?? ""}
          defaultValues={{
            firstName: profile?.first_name ?? "",
            lastName: profile?.last_name ?? "",
            phone: profile?.phone ?? "",
            marketingConsent: profile?.marketing_consent ?? false,
          }}
        />
      </Panel>
      <Panel aria-labelledby="security-title" sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Typography id="security-title" variant="h5" component="h3" sx={{ color: "primary.main" }}>
          Парола и сигурност
        </Typography>
        <Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Профилът е създаден на {formatDate(user.created_at)}
          </Typography>
        </Box>
        <Button variant="outlined" href={routes.newPassword}>
          Смени паролата
        </Button>
      </Panel>
    </>
  );
}
