import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";
import CommunityComponent from "@/components/communitypage";
export default function CommunityPage() {
  return (
    <main>
      <HeroHeader />
      <div className="mt-16">
      <CommunityComponent />
      </div>
      <FooterSection />
    </main>
  );
}
