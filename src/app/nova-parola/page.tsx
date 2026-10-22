import type { Metadata } from "next";
import Button from "@mui/material/Button";
import { AuthCard } from "@/components/auth/AuthCard";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { FormAlert } from "@/components/forms/FormAlert";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Нова парола",
  description: "Задай нова парола за профила си.",
  robots: { index: false },
};

/** Reached from the reset email (signed in by /auth/confirm) or from the profile to change the password. */
export default async function NewPasswordPage() {
  const user = await getCurrentUser();

  return (
    <AuthCard eyebrow="Моят профил" title="Нова парола" lead={user ? `Профил: ${user.email}` : undefined}>
      {user ? (
        <NewPasswordForm />
      ) : (
        <>
          <FormAlert severity="warning">
            Линкът за нова парола е изтекъл или вече е използван. Поискай нов, за да продължиш.
          </FormAlert>
          <Button variant="contained" href={routes.forgotPassword}>
            Поискай нов линк
          </Button>
        </>
      )}
    </AuthCard>
  );
}
