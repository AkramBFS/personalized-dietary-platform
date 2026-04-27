import Services from "@/components/services";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";

export default function ServicesPage() {
  return (
    <main className="dark min-h-screen text-foreground selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      <Services />
      <FooterSection />
    </main>
  );
}
