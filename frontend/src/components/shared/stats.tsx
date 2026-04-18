import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="bg-background @container py-24">
      <div className="mx-auto max-w-2xl px-6">
        <Card variant="outline" className="p-8 md:p-12">
          <div className="text-muted-foreground mb-6 text-sm font-medium">
            Choose a plan that works for you
          </div>
          <h2 className="text-balance font-serif text-3xl font-medium md:text-4xl">
            Start Your Health Journey Today
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md text-balance">
            Get 3 months free when you sign up for an annual plan. No credit
            card required to start.
          </p>
          <Button asChild className="mt-8 gap-2">
            <Link href="#link">
              Get started!
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </section>
  );
}
