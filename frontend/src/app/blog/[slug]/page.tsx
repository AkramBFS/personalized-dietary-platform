import React from "react";
import SingleBlogPostPageComponent from "@/components/SingleBlogPostPageComponent"; // Adjust path if you named it differently
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";

export default function SingleBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  // Note: Later, when you connect your API, you will use `slug`
  // to fetch the specific data for this article before passing it to the component!

  return (
    <main>
      <HeroHeader />
      <SingleBlogPostPageComponent slug={slug} />
      <FooterSection />
    </main>
  );
}

