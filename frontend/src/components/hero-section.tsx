import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HeroHeader } from "./header";
import { ChevronRight, CirclePlay } from "lucide-react";
import { MessageCircle } from "lucide-react";
import Image from "next/image";

const professionals = [
  {
    name: "Dr. Sarah Collins",
    title: "Registered Dietitian (RD)",
    image: "/professionals/pf1.jpg",
  },
  {
    name: "Dr. Ahmed Benali",
    title: "Clinical Nutritionist",
    image: "/professionals/pf2.jpg",
  },
  {
    name: "Dr. John Meyer",
    title: "Sports Nutrition Specialist",
    image: "/professionals/pf3.jpg",
  },
];

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <section className="bg-linear-to-b from-background to-card">
          <div className="relative py-36">
            <div className="relative z-10 mr-auto w-full max-w-5xl px-25">
              <div className="md:w-1/2">
                <div>
                  <h1 className="max-w-md text-balance text-5xl font-medium md:text-6xl">
                    Your AI-Powered Personal Dietitian and calorie counter
                  </h1>
                  <p className="text-muted-foreground my-8 max-w-2xl text-balance text-xl">
                    Meet with professionals! Get personalized dietary
                    recommendations, meal plans, and nutrition advice tailored
                    to your unique needs and preferences.
                  </p>

                  <div className="flex items-center gap-3">
                    <Button asChild size="lg" className="pr-4.5">
                      <Link href="#link">
                        <span className="text-nowrap">Get Started</span>
                        <ChevronRight className="opacity-50" />
                      </Link>
                    </Button>
                    <Button
                      key={2}
                      asChild
                      size="lg"
                      variant="outline"
                      className="pl-5"
                    >
                      <Link href="#link">
                        <MessageCircle className="w-5 h-5 stroke-primary" />
                        <span className="text-nowrap">Ask Chatbot</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-10">
                  <p className="text-muted-foreground">
                    Trusted by licensed professionals:
                  </p>
                  <div className="mt-6 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-3">
                    {professionals.map((pro) => (
                      <div
                        key={pro.name}
                        className="bg-card text-card-foreground rounded-xl p-4 shadow-sm ring-1 ring-border"
                      >
                        <Image
                          src={pro.image}
                          alt={pro.name}
                          width={160}
                          height={160}
                          className="mx-auto rounded-lg object-cover"
                        />

                        <div className="mt-4 text-center">
                          <p className="font-medium">{pro.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pro.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="perspective-near mt-24 translate-x-12 md:absolute md:-right-6 md:bottom-16 md:left-1/2 md:top-40 md:mt-0 md:translate-x-0">
              <div className="before:border-foreground/5 before:bg-foreground/5 relative h-full before:absolute before:-inset-x-4 before:bottom-7 before:top-0 before:skew-x-6 before:rounded-[calc(var(--radius)+1rem)] before:border">
                <div className="bg-background rounded-(--radius) shadow-foreground/10 ring-foreground/5 relative h-full -translate-y-12 skew-x-6 overflow-hidden border border-transparent shadow-md ring-1">
                  <Image
                    src="/branding/screen.jpg"
                    alt="App dashboard preview"
                    width="1440"
                    height="900"
                    className="object-top-left size-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
