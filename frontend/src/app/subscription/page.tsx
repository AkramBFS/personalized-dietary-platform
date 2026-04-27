import SubscriptionPlans from "@/components/subscription/subscription";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";

export default function SubscriptionPage() {
  return (
    <main className="dark min-h-screen text-foreground selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      <SubscriptionPlans />
      <FooterSection />
    </main>
  );
}
