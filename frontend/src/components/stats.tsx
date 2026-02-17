import Image from "next/image";

export default function Stats() {
  return (
    <section className="bg-background @container pt-24">
      <div className="mx-auto max-w-2xl px-6">
        <div className="space-y-4">
          <h2 className="text-balance text-4xl font-medium">
            Trusted by Users and Experts Worldwide
          </h2>
          <p className="text-muted-foreground text-balance">
            Our platform has been trusted by users and experts worldwide to
            provide personalized meal plans and expert advice. With a commitment
            to quality and user satisfaction, we have built a reputation for
            delivering exceptional service and support to our users.
          </p>
        </div>
        <div className="@xl:grid-cols-3 mt-12 grid gap-6 text-sm">
          <div className="border-t py-6">
            <p className="text-muted-foreground text-xl">
              <span className="text-foreground font-medium">99.9%</span> Uptime
              guarantee.
            </p>
          </div>

          <div className="border-t py-6">
            <p className="text-muted-foreground text-xl">
              <span className="text-foreground font-medium">10M+</span> Meals
              planned and counting.
            </p>
          </div>

          <div className="border-t py-6">
            <p className="text-muted-foreground text-xl">
              <span className="text-foreground font-medium">500+</span> Expert
              consultations.
            </p>
          </div>
        </div>
      </div>
      <div className="mask-radial-from-65% mask-radial-at-bottom mask-radial-[50%_100%] pointer-events-none relative mx-auto max-w-4xl dark:opacity-50">
        <div className="bg-primary absolute inset-0 z-10 mix-blend-overlay" />
        <Image
          src="/branding/Globe.jpg"
          alt="globe with world map"
          className="dark:invert"
          width={2928}
          height={1464}
        />
      </div>
    </section>
  );
}
