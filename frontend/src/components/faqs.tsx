"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Link from "next/link";

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

export default function FAQsThree() {
  const faqItems: FAQItem[] = [
    {
      id: "item-1",
      icon: "brain",
      question: "How does the AI calorie estimation work?",
      answer:
        "You can upload an image of your meal, and our AI system analyzes it using computer vision to recognize food items and estimate portion sizes. The system then calculates approximate calorie values based on nutritional databases. Results are designed to support awareness and self-monitoring, not replace professional advice.",
    },
    {
      id: "item-2",
      icon: "user-check",
      question: "How do personalized nutrition consultations work?",
      answer:
        "After creating an account and completing your health profile, you can book an online consultation with a certified nutritionist. Based on your medical history, lifestyle, and goals, a personalized dietary plan is created and monitored through scheduled follow-ups.",
    },
    {
      id: "item-3",
      icon: "credit-card",
      question: "How do subscriptions and payments work?",
      answer:
        "Each nutrition plan has a defined duration and price. Payment must be completed to access personalized consultations and follow-up services. Seasonal or limited-period programs (such as summer or Ramadan plans) may also be available depending on the period.",
    },
    {
      id: "item-4",
      icon: "activity",
      question: "Can I use the platform without a personalized plan?",
      answer:
        "Yes. Users can access the AI calorie tracking feature independently for self-monitoring. This is especially useful for maintaining weight after completing a structured program or for those enrolled in flexible or seasonal plans.",
    },
    {
      id: "item-5",
      icon: "book-open",
      question: "What additional resources are available?",
      answer:
        "The platform includes educational blogs, nutrition news, healthy lifestyle content, and community features where users can share experiences and testimonials. You can also subscribe to newsletters for updates and wellness tips.",
    },
  ];

  return (
    <section className="bg-background dark:bg-background py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:gap-16">
          <div className="md:w-1/3">
            <div className="sticky top-20">
              <h2 className="mt-4 text-3xl font-bold">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mt-4">
                Can't find what you're looking for? Check out our{" "}
                <Link
                  href="#"
                  className="text-primary font-medium hover:underline"
                >
                  FAQ page
                </Link>
              </p>
            </div>
          </div>
          <div className="md:w-2/3">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="bg-background shadow-xs rounded-lg border px-4 last:border-b"
                >
                  <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex size-6">
                        <DynamicIcon
                          name={item.icon}
                          className="m-auto size-4"
                        />
                      </div>
                      <span className="text-base">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="px-9">
                      <p className="text-base">{item.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
