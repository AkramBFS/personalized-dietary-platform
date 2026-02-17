import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Sparkles } from "lucide-react";
import { CalendarCheck } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { ReactNode } from "react";

export default function Features() {
  return (
    <section className="py-16 md:py-32">
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            Check out our features!
          </h2>
          <p className="mt-4">
            Our platform offers a range of features designed to help you achieve
            your health and wellness goals. From personalized meal plans to
            expert advice, we have everything you need to succeed on your
            journey towards a healthier lifestyle.
          </p>
        </div>
        <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
          <Card className="group border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <CardDecorator>
                <CalendarCheck className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Schedule meetings!</h3>
            </CardHeader>

            <CardContent className="mt-3">
              <p className="text-sm">
                Connect with our team of experts to get personalized advice and
                guidance on your health and wellness journey.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <CardDecorator>
                <ClipboardList className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Check out our plans!</h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm">
                We offer a variety of plans to suit your needs and budget.
                Choose the one that works best for you and start your journey
                towards a healthier lifestyle today!
              </p>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Sparkles className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Powered By AI</h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm">
                Our platform provides an AI powered meal calorie calculator that
                helps you make informed decisions about your diet and nutrition.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-50"
    />

    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);
