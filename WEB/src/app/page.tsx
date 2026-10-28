import Hero from "@/components/Hero";
import PackagesRail from "@/components/PackagesRail";
import GlobeSection from "@/components/GlobeSection";
import { Cta, Deals, Included, Steps, Styles, Testimonials } from "@/components/HomeSections";
import { Marquee } from "@/components/ui";
import { DepartureBoard, PhotoWall } from "@/components/AnimatedSections";
import { packages } from "@/data/packages";

export default function Home() {
  const words = [...new Set(packages.map((p) => p.country))];
  return (
    <main>
      <Hero />
      <Styles />
      <Marquee
        className="-rotate-2 border-y border-ice/10 bg-glow py-5 text-ink"
        items={words.map((w) => (
          <span key={w} className="text-4xl font-semibold uppercase tracking-tight md:text-6xl">
            {w}
          </span>
        ))}
      />
      <PackagesRail />
      <Deals />
      <DepartureBoard />
      <GlobeSection />
      <PhotoWall />
      <Included />
      <Steps />
      <Testimonials />
      <Cta />
    </main>
  );
}
