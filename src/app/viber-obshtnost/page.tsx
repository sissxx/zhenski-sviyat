import type { Metadata } from "next";
import { PlanDetails } from "@/components/membership/PlanDetails";
import { PageIntro } from "@/components/ui/PageIntro";
import { membershipPlans } from "@/content/plans";

export const metadata: Metadata = {
  title: "Затворена Viber общност",
  description: "Месечно членство в затворената Viber общност на Сдружение Женски свят.",
};

export default function ViberCommunityPage() {
  return (
    <>
      <PageIntro
        eyebrow="Затворена Viber група на общността"
        title="Членство в затворената общност"
        lead="Месечен абонамент за участие в затворената общност на сдружението."
      />
      <PlanDetails
        plan={membershipPlans.viber}
        heading="Подкрепа и обмен на опит"
        intro="Затворено пространство за общуване, взаимопомощ и обмен на опит между членовете на общността. Членството дава достъп до една или повече тематични групи."
        bg="brand.mintLight"
      />
    </>
  );
}
