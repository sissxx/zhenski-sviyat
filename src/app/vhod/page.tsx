import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { FormAlert } from "@/components/forms/FormAlert";
import { TextLink } from "@/components/ui/AppLink";
import { routes, safeNextPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Вход",
  description: "Влез в профила си в Сдружение Женски свят.",
  robots: { index: false },
};

type LoginPageProps = { searchParams: Promise<{ next?: string | string[]; greshka?: string | string[] }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, greshka } = await searchParams;
  const continueTo = safeNextPath(typeof next === "string" ? next : null);

  return (
    <AuthCard
      eyebrow="Моят профил"
      title="Вход"
      lead="Влез с имейла и паролата, с които се регистрира."
      footer={
        <span>
          Нямаш профил? <TextLink href={routes.register}>Регистрирай се</TextLink>
        </span>
      }
    >
      {greshka === "link" && (
        <FormAlert severity="error">
          Линкът е невалиден или е изтекъл. Влез с паролата си или{" "}
          <TextLink href={routes.forgotPassword}>поискай нов линк</TextLink>.
        </FormAlert>
      )}
      <LoginForm next={continueTo} />
    </AuthCard>
  );
}
