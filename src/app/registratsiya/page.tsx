import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { TextLink } from "@/components/ui/AppLink";
import { membershipPlans } from "@/content/plans";
import { loginPath, routes, safeNextPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Създай профил в Сдружение Женски свят, за да се записваш за събития, консултации и членство.",
  robots: { index: false },
};

type RegisterPageProps = { searchParams: Promise<{ plan?: string | string[]; next?: string | string[] }> };

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { plan, next } = await searchParams;
  const chosenPlan = Object.values(membershipPlans).find((item) => item.slug === plan);
  // After confirming the email, a new member continues to their subscriptions to activate the chosen plan.
  const continueTo = chosenPlan
    ? `${routes.accountSubscriptions}?plan=${chosenPlan.slug}`
    : safeNextPath(typeof next === "string" ? next : null, `${routes.account}?potvarden=1`);

  return (
    <AuthCard
      eyebrow="Стани част от нас"
      title="Създай профил"
      lead={
        chosenPlan
          ? `След като потвърдиш имейла си, ще можеш да активираш членството „${chosenPlan.title.replace(/[„“]/g, "")}“ от профила си.`
          : "С профил се записваш за събития и консултации, следиш плащанията си и управляваш членството си."
      }
      footer={
        <span>
          Вече имаш профил? <TextLink href={loginPath(typeof next === "string" ? next : undefined)}>Влез</TextLink>
        </span>
      }
    >
      <RegisterForm next={continueTo} />
    </AuthCard>
  );
}
