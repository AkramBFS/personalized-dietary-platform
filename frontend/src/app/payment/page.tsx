import PaymentSection from "@/components/payment";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";

export default function PaymentPage() {
  return (
    <main className="dark min-h-screen text-foreground selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      <PaymentSection />
      <FooterSection />
    </main>
  );
}
