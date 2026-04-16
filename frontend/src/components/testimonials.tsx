import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Testimonials() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-4xl font-medium lg:text-5xl dark:text-white">
            Real experiences from people improving their health{" "}
          </h2>
          <p className="dark:text-gray-300">
            Our platform helps users track their nutrition, follow personalized
            diet plans, and build healthier habits with the support of
            professional nutritionists and AI-powered tools.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
          <Card className="bg-background grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2">
            <CardHeader>
              <h3 className="text-2xl font-medium dark:text-white">
                What our users say about us:
              </h3>
            </CardHeader>
            <CardContent>
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-xl font-medium dark:text-gray-200">
                  The personalized nutrition plan completely changed how I
                  approach food. Instead of following restrictive diets, I now
                  have a plan that actually fits my lifestyle and daily routine.
                  The calorie tracking feature helps me stay aware of what I eat
                  without feeling overwhelmed or constantly stressed about
                  counting everything. It has made building healthier habits
                  much easier and more sustainable.
                </p>

                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src="/professionals/mj.jpg"
                      alt="Shekinah Tshiokufila"
                      height="400"
                      width="400"
                      loading="lazy"
                    />
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>

                  <div>
                    <cite className="text-sm font-medium dark:text-gray-100">Michael Jackson</cite>
                    <span className="text-muted-foreground block text-sm">
                      Marketing heehee Manager
                    </span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card className="bg-background md:col-span-2">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-xl font-medium dark:text-gray-200">
                  The AI calorie tracking makes it so easy to understand what
                  I’m eating every day. Combined with the nutritionist guidance,
                  it really helped me build healthier habits.
                </p>

                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src="/professionals/mj3.jpg"
                      alt="Jonathan Yombo"
                      height="400"
                      width="400"
                      loading="lazy"
                    />
                    <AvatarFallback>SD</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-sm font-medium dark:text-gray-100">Snoop dog</cite>
                    <span className="text-muted-foreground block text-sm">
                      Pharmacist and Entrepreneur
                    </span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="dark:text-gray-300">
                  After struggling with dieting for years, having a personalized
                  plan and regular follow-up made a huge difference. I finally
                  feel in control of my nutrition.
                </p>

                <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                  <Avatar className="size-12">
                    <AvatarImage
                      src="/professionals/mj2.jpg"
                      alt="Yucel Faruksahan"
                      height="400"
                      width="400"
                      loading="lazy"
                    />
                    <AvatarFallback>CB</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-sm font-medium dark:text-gray-100">Chris Bumsted</cite>
                    <span className="text-muted-foreground block text-sm">
                      Fitness Enthusiast
                    </span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card className="bg-background card variant-mixed">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="dark:text-gray-300">
                  The meal recognition feature is surprisingly helpful. Just
                  uploading a photo gives me a quick estimate of calories and
                  helps me stay consistent with my goals.
                </p>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src="/professionals/mj4.jpg"
                      alt="Rodrigo Aguilar"
                      height="400"
                      width="400"
                      loading="lazy"
                    />
                    <AvatarFallback>SH</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-100">Souki Hocine</p>
                    <span className="text-muted-foreground block text-sm">
                      Student delegue
                    </span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
