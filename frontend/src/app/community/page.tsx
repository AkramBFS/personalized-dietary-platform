import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";
import CommunityComponent from "@/components/communitypage";
export default function CommunityPage() {
  return (
    <main>
      <HeroHeader />
      <CommunityComponent />
      <FooterSection />
    </main>
  );
}
