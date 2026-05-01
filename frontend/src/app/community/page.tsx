import { HeroHeader } from "@/components/layout/navbar";
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
