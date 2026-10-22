import { About } from "@/components/home/About";
import { Events } from "@/components/home/Events";
import { FaqAndDonate } from "@/components/home/FaqAndDonate";
import { Founders } from "@/components/home/Founders";
import { Hero } from "@/components/home/Hero";
import { Membership } from "@/components/home/Membership";
import { Services } from "@/components/home/Services";
import { Topics } from "@/components/home/Topics";

export default function HomePage() {
  return (
    <>
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
