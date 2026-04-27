import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";
import CommunityComponent from "@/components/communitypage";
export default function CommunityPage() {
  return (
    <main className="dark min-h-screen text-foreground selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      <CommunityComponent />
      <FooterSection />
    </main>
  );
}
