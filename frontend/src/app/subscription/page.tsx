import SubscriptionPlans from "@/components/subscription/subscription";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";

export default function SubscriptionPage() {
  return (
    <main>
      <HeroHeader />
      <SubscriptionPlans />
      <FooterSection />
    </main>
  );
}
