import type { Metadata } from "next";
import { PlanDetails } from "@/components/membership/PlanDetails";
import { PageIntro } from "@/components/ui/PageIntro";
import { membershipPlans } from "@/content/plans";
import { getPublicPlan } from "@/lib/subscriptions/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("beautyClub");

export default async function BeautyClubPage() {
  const plan = await getPublicPlan(membershipPlans.beautyClub.slug);
  return (
    <>
      <PageIntro
        eyebrow="Красота, стил и естетика"
        title="Клуб с месечен абонамент"
        lead="Професионални насоки за лична грижа и достъп до затворена Viber група."
      />
      <PlanDetails plan={plan} heading="Грижа с внимание към теб" bg="brand.sand" />
    </>
  );
}
