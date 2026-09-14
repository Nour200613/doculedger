import { Navbar } from "@/components/common/Navbar";
import { Hero } from "@/components/landing/Hero";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { PricingCards } from "@/components/landing/PricingCards";
import { Testimonials } from "@/components/landing/Testimonials";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { Footer } from "@/components/common/Footer";
import { CommandPalette } from "@/components/common/CommandPalette";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-blue-100 selection:text-navy-900">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <InteractiveDemo />
        <PricingCards />
        <Testimonials />
        <FaqAccordion />
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
}
