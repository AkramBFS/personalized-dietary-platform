import { Shredder, Lock, Sparkles, Zap } from "lucide-react";

export default function ContentSection() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
        <div className="mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">
            Meet our experts through video calls!
          </h2>
          <p>
            Our experts are here to help you achieve your health and wellness
            goals. Whether you're looking for personalized meal plans, expert
            advice, or support on your journey towards a healthier lifestyle, we
            have everything you need to succeed. Our team of experts is
            dedicated to providing you with the guidance and support you need to
            make informed decisions about your health and wellness.
          </p>
        </div>
        <img
          className="rounded-(--radius)"
          src="branding/expert-call.jpg"
          alt="team image"
          height=""
          width=""
          loading="lazy"
        />

        <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4" />
              <h3 className="text-sm font-medium">Fast & responsive</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Our fast, responsive platform delivers instant access to
              personalized meal plans and expert advice. We provide all the
              essential tools and support you need to achieve a healthier
              lifestyle.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shredder className="size-4" />
              <h3 className="text-sm font-medium">Confidential</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              We make sure that all your data is kept confidential and secure.
              We use state-of-the-art encryption and security measures to
              protect your information and ensure that it is only accessible to
              you and our team of experts.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="size-4" />
              <h3 className="text-sm font-medium">Security</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              We take security seriously and use the latest technology to ensure
              that your data is safe and secure. Our platform is designed to
              protect your information and keep it confidential at all times.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />

              <h3 className="text-sm font-medium">AI Powered</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Our AI-powered calculator helps you monitor meal calories and
              adjust your diet with ease to reach your wellness targets.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
