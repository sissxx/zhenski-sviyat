import type { Metadata } from "next";
import { EmptyState } from "@/components/account/EmptyState";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Моите събития" };

export default function AccountEventsPage() {
  return (
    <EmptyState title="Моите събития" action={{ label: "Виж предстоящите събития", href: routes.events }}>
      Все още нямаш записвания. Когато се запишеш за събитие, тук ще виждаш датата, мястото и статуса на плащането.
    </EmptyState>
  );
}
