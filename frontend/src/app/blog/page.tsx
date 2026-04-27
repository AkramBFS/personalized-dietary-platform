import BlogPageComponent from "@/components/blogpage";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";

export default function BlogPage() {
  return (
    <main className="dark min-h-screen text-foreground selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      <BlogPageComponent />
      <FooterSection />
    </main>
  );
}
