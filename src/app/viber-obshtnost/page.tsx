import type { Metadata } from "next";
import { PlanDetails } from "@/components/membership/PlanDetails";
import { PageIntro } from "@/components/ui/PageIntro";
import { membershipPlans } from "@/content/plans";
import { getPublicPlan } from "@/lib/subscriptions/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("viber");

export default async function ViberCommunityPage() {
  const plan = await getPublicPlan(membershipPlans.viber.slug);
  return (
    <>
      <PageIntro
        eyebrow="Затворена Viber група на общността"
        title="Членство в затворената общност"
        lead="Месечен абонамент за участие в затворената общност на сдружението."
      />
      <PlanDetails
        plan={plan}
        heading="Подкрепа и обмен на опит"
        intro="Затворено пространство за общуване, взаимопомощ и обмен на опит между членовете на общността. Членството дава достъп до една или повече тематични групи."
        bg="brand.mintLight"
      />
    </>
  );
}
