import type { Metadata } from "next";
import { About } from "@/components/home/About";
import { Events } from "@/components/home/Events";
import { FaqAndDonate } from "@/components/home/FaqAndDonate";
import { Founders } from "@/components/home/Founders";
import { Hero } from "@/components/home/Hero";
import { Membership } from "@/components/home/Membership";
import { Services } from "@/components/home/Services";
import { Topics } from "@/components/home/Topics";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = pageMetadata("home");

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero />
      <Topics />
      <Services />
      <About />
      <Events />
      <Membership />
      <Founders />
      <FaqAndDonate />
    </>
  );
}
