import type { Metadata } from "next";
import { EmptyState } from "@/components/account/EmptyState";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Моите консултации" };

export default function AccountConsultationsPage() {
  return (
    <EmptyState title="Моите консултации" action={{ label: "Запази консултация", href: routes.consultations }}>
      Все още нямаш запазени консултации. След като запазиш час, тук ще виждаш датата, часа и специалиста, а също ще
      можеш да го преместиш или откажеш.
    </EmptyState>
  );
}
