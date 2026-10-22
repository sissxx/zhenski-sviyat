import type { Metadata } from "next";
import { EmptyState } from "@/components/account/EmptyState";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Моите абонаменти" };

export default function AccountSubscriptionsPage() {
  return (
    <EmptyState title="Моите абонаменти" action={{ label: "Разгледай членствата", href: routes.packages }}>
      Все още нямаш активно членство. Когато се абонираш за клуба или Viber общността, тук ще виждаш до кога е
      платено и линка за достъп до групата.
    </EmptyState>
  );
}
