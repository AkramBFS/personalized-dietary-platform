import BlogPageComponent from "@/components/blogpage";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";

export default function BlogPage() {
  return (
    <main>
      <HeroHeader />
      <BlogPageComponent />
      <FooterSection />
    </main>
  );
}
