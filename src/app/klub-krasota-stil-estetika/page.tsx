import type { Metadata } from "next";
import { PlanDetails } from "@/components/membership/PlanDetails";
import { PageIntro } from "@/components/ui/PageIntro";
import { membershipPlans } from "@/content/plans";

export const metadata: Metadata = {
  title: "Клуб „Красота, стил и естетика“",
  description: "Клуб с месечен абонамент: професионални насоки за лична грижа и достъп до затворена Viber група.",
};

export default function BeautyClubPage() {
  return (
    <>
      <PageIntro
        eyebrow="Красота, стил и естетика"
        title="Клуб с месечен абонамент"
        lead="Професионални насоки за лична грижа и достъп до затворена Viber група."
      />
      <PlanDetails plan={membershipPlans.beautyClub} heading="Грижа с внимание към теб" bg="brand.sand" />
    </>
  );
}
