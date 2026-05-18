import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ChevronRight, MessageCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <main>
      {/* Added justify-center to center the container horizontally */}
      <section className="relative h-screen flex items-center justify-center bg-section-hero">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 mt-8">
          {/* Added text-center and mx-auto to center the content block */}
          <div className="max-w-3xl mx-auto text-center">
            <p className="mb-4 text-sm uppercase tracking-widest text-primary font-medium">
              SVMB / professional dietary assessment platform
            </p>

            <h1 className="font-syne text-foreground text-5xl leading-[1.05] md:text-6xl lg:text-7xl tracking-tight">
              Your personal
              <br />
              <span className="text-primary">AI dietitian</span>,
              <br />
              powered by data
            </h1>

            {/* Added mx-auto to center the paragraph since it has a max-width */}
            <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              Track calories, analyze meals from photos, and get personalized
              nutrition guidance — all in one intelligent system built to adapt
              to you.
            </p>

            {/* Added justify-center to align the buttons in the middle */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="pr-4.5">
                <Link href="/register">
                  Get started
                  <ChevronRight className="ml-1 opacity-70" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
              >
                <Link href="#chat">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Ask the AI
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
