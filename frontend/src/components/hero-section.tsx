import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ChevronRight, MessageCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <main>
      <div className="absolute inset-0 -z-10 h-[100vh]">
        <Image
          src="/branding/hero-bg.jpg"
          alt="Healthy lifestyle background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      </div>
      <section className="relative h-screen flex items-center">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm uppercase tracking-widest text-emerald-300 font-medium">
              SVMB / professional dietary assessment platform
            </p>

            <h1 className="font-syne text-white text-5xl leading-[1.05] md:text-6xl lg:text-7xl tracking-tight">
              Your personal
              <br />
              <span className="text-emerald-300">AI dietitian</span>,
              <br />
              powered by data
            </h1>

            <p className="mt-8 max-w-2xl text-lg md:text-xl text-white/80 leading-relaxed">
              Track calories, analyze meals from photos, and get personalized
              nutrition guidance — all in one intelligent system built to adapt
              to you.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
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
                className="border-white/30 text-foreground hover:bg-foreground/10"
              >
                <Link href="#chat">
                  <MessageCircle className="w-5 h-5" />
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
