import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AppLink } from "@/components/ui/AppLink";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Забравена парола",
  description: "Получи линк за нова парола за профила си в Сдружение Женски свят.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="Моят профил"
      title="Забравена парола"
      lead="Въведи имейла на профила си и ще ти изпратим линк, с който да зададеш нова парола."
      footer={
        <span>
          Спомни си паролата? <AppLink href={routes.login}>Влез</AppLink>
        </span>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
