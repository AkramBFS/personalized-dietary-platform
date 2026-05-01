"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Circle, HelpCircle } from "lucide-react";

// --- FAQ Data Model ---
const faqCategories = [
  {
    id: "general",
    label: "01 General",
    title: "General",
    items: [
      {
        q: "What is this platform?",
        a: "This platform is a web-based system for personalized dietary assessment and AI-assisted calorie tracking. It combines professional online nutrition consultations with intelligent tools that help users understand and monitor their food intake, lifestyle habits, and long-term health goals.",
      },
      {
        q: "Who is this platform for?",
        a: "The platform is designed for individuals facing weight-related or metabolic challenges, including those dealing with hormonal imbalances, insulin resistance, PCOS, thyroid disorders, postpartum recovery, chronic fatigue, or repeated dieting cycles. It can also be used by anyone seeking sustainable, health-focused lifestyle guidance.",
      },
      {
        q: "Is this a medical service?",
        a: "No. The platform does not provide medical diagnosis or treatment. Nutrition consultations are provided by qualified nutrition professionals, and AI-based features are intended for educational and self-monitoring purposes only. Users should always consult healthcare professionals for medical concerns.",
      },
    ],
  },
  {
    id: "ai-tracking",
    label: "02 AI Tracking",
    title: "AI-Assisted Calorie Tracking",
    items: [
      {
        q: "How does the AI calorie estimation work?",
        a: "You can upload an image of your meal, and the AI system analyzes it using computer vision techniques to recognize food items and estimate portion sizes. Calorie values are then approximated using standard nutritional databases. The results are designed to support awareness and self-monitoring, not to replace professional advice.",
      },
      {
        q: "How accurate is the calorie estimation?",
        a: "Calorie estimation from images is inherently approximate. Factors such as portion size, preparation method, and hidden ingredients can affect accuracy. The feature is intended to increase food awareness and support habit-building rather than provide exact nutritional measurements.",
      },
      {
        q: "Can I rely only on the AI without a nutritionist?",
        a: "The AI feature can be used independently for general awareness, especially by users who are not currently following a personalized plan. However, for individuals with specific health conditions or weight management challenges, professional guidance is strongly recommended.",
      },
      {
        q: "What types of meals can the AI recognize?",
        a: "The system is designed to recognize common meals and food items. Performance may vary depending on image quality, lighting, and food complexity. Over time, the system can be improved through research and model refinement.",
      },
    ],
  },
  {
    id: "consultations",
    label: "03 Consultations",
    title: "Personalized Nutrition Consultations",
    items: [
      {
        q: "How do personalized nutrition consultations work?",
        a: "After creating an account and completing your health profile, you can book an online consultation with a certified nutritionist. Based on your medical history, lifestyle, and personal goals, the nutritionist designs a personalized dietary plan and provides follow-up guidance.",
      },
      {
        q: "Are consultations conducted online?",
        a: "Yes. Consultations are conducted online through video calls, allowing users to access nutrition services worldwide without geographical limitations.",
      },
      {
        q: "Can nutrition plans be adjusted over time?",
        a: "Yes. Nutritionists monitor user progress and can adjust dietary plans based on results, feedback, and changing health or lifestyle conditions.",
      },
      {
        q: "How long does a nutrition plan last?",
        a: "Each plan has a defined duration, which may vary depending on the program selected. Some plans are long-term, while others are seasonal or limited-period programs.",
      },
    ],
  },
  {
    id: "services-payments",
    label: "04 Services & Payments",
    title: "Services, Subscriptions, and Payments",
    items: [
      {
        q: "What services are available on the platform?",
        a: "The platform offers multiple services, including personalized nutrition consultations, structured dietary programs, AI-assisted calorie tracking, and educational content. For a complete and up-to-date list of available services, please visit the Services page: 👉 /services",
      },
      {
        q: "How do subscriptions and payments work?",
        a: "Each nutrition plan or service has a defined price and duration. Payment must be completed before gaining access to personalized consultations and follow-up services. Subscription-based and pay-per-use options may be available depending on the service.",
      },
      {
        q: "Are seasonal or special programs available?",
        a: "Yes. The platform may offer seasonal or limited-period programs, such as summer plans or Ramadan-specific programs, depending on the time of year.",
      },
      {
        q: "Can I cancel or change my plan?",
        a: "Cancellation and modification policies depend on the specific service or subscription. Detailed terms are provided during the service selection and payment process.",
      },
    ],
  },
  {
    id: "accounts",
    label: "05 Accounts & Usage",
    title: "Accounts and Usage",
    items: [
      {
        q: "Do I need an account to use the platform?",
        a: "Yes. Creating an account is required to access AI tracking features, book consultations, manage subscriptions, and view personalized content.",
      },
      {
        q: "Can I use the platform without a personalized plan?",
        a: "Yes. Users can access the AI-assisted calorie tracking feature independently for self-monitoring. This is especially useful for maintaining weight after completing a structured program or for those enrolled in flexible or seasonal plans.",
      },
      {
        q: "Can I switch from AI-only usage to a personalized plan later?",
        a: "Yes. Users can start with AI-based tracking and later choose to book personalized consultations or subscribe to structured nutrition programs.",
      },
    ],
  },
  {
    id: "community",
    label: "06 Community",
    title: "Content and Community",
    items: [
      {
        q: "What educational content is available?",
        a: "The platform includes blogs, nutrition-related articles, healthy lifestyle resources, and wellness insights. These are designed to complement professional consultations and promote informed decision-making.",
      },
      {
        q: "Is there a community feature?",
        a: "Yes. Users may share experiences, testimonials, and feedback. Community features are designed to encourage motivation and knowledge sharing in a respectful environment.",
      },
    ],
  },
  {
    id: "privacy",
    label: "07 Privacy & Data",
    title: "Privacy, Security, and Data",
    items: [
      {
        q: "Is my personal and health data secure?",
        a: "Yes. User data is handled with strict attention to privacy and security. Personal and health-related information is used only to provide platform services and is protected using standard security practices.",
      },
      {
        q: "Is my data shared with third parties?",
        a: "No personal data is shared without user consent, except where required by law or necessary to deliver platform services.",
      },
      {
        q: "Are meal images stored permanently?",
        a: "Image handling policies depend on system configuration and research requirements. Clear information about data retention is provided within the platform's privacy policy.",
      },
    ],
  },
  {
    id: "research",
    label: "08 Academic Context",
    title: "Academic and Research Context",
    items: [
      {
        q: "Is this platform part of an academic project?",
        a: "Yes. This platform is developed as part of an academic project in computer science, focusing on web technologies, software engineering, and AI-assisted dietary assessment.",
      },
      {
        q: "Does the AI system contribute to research?",
        a: "Yes. The project includes research on vision-based nutritional assessment systems. Findings are documented and compared with existing scientific literature as part of the academic work.",
      },
    ],
  },
  {
    id: "support",
    label: "09 Support",
    title: "Support and Contact",
    items: [
      {
        q: "How can I get help or ask questions?",
        a: "Users can contact the platform administrator through the available contact options within the application for technical issues, account support, or general inquiries.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Navigation Observer for Sticky Sidebar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      },
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const toggleItem = (categoryId: string, itemIndex: number) => {
    const key = `${categoryId}-${itemIndex}`;
    setOpenItems((prev: Record<string, boolean>) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <main className="pt-24 md:pt-48 pb-32 px-8 md:px-24 max-w-7xl mx-auto selection:bg-brand/30 min-h-screen text-card-foreground">
      {/* Header Section */}
      <header className="max-w-4xl mb-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-brand uppercase tracking-[0.3em] text-sm mb-6 font-semibold flex items-center gap-3"
        >
          <HelpCircle className="w-4 h-4 text-brand" />
          Knowledge Base
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-12 font-headline"
        >
          Frequently Asked <br />
          <span className="text-brand italic">Questions.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-xl md:text-2xl font-light leading-relaxed max-w-2xl border-l border-border pl-6"
        >
          Find answers regarding our dietary assessment systems, AI tools,
          consultations, and platform operations.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
        {/* Sticky Sidebar Navigation */}
        <aside className="hidden md:block md:col-span-3 sticky top-48 self-start">
          <nav className="flex flex-col gap-6 text-xs uppercase tracking-widest border-l border-border pl-6 font-semibold">
            {faqCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                onClick={(e) => scrollToSection(e, category.id)}
                className={`transition-all duration-300 ${
                  activeSection === category.id
                    ? "text-brand font-bold scale-105 origin-left"
                    : "text-muted-foreground hover:text-brand"
                }`}
              >
                {category.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content Areas */}
        <article className="md:col-span-9 max-w-3xl space-y-32">
          {faqCategories.map((category, catIndex) => (
            <section
              key={category.id}
              className="scroll-mt-48"
              id={category.id}
            >
              <div className="flex flex-col gap-8">
                <div className="text-xs text-brand/60 uppercase tracking-widest font-semibold flex items-center gap-2">
                  <span className="font-mono text-brand">
                    0{catIndex + 1} •
                  </span>
                  {category.title}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-headline">
                  {category.title}
                </h2>

                <div className="flex flex-col gap-4 mt-4">
                  {category.items.map((item, itemIndex) => {
                    const isOpen = openItems[`${category.id}-${itemIndex}`];

                    return (
                      <div
                        key={itemIndex}
                        className="group border border-border bg-accent hover:border-brand transition-colors rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(category.id, itemIndex)}
                          className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                        >
                          <span className="text-xl font-medium text-card-foreground pr-8 group-hover:text-brand transition-colors">
                            {item.q}
                          </span>
                          <Plus
                            className={`text-brand shrink-0 transition-transform duration-300 ${
                              isOpen ? "rotate-45" : "rotate-0"
                            }`}
                            size={24}
                          />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 md:px-8 pb-8 text-muted-foreground text-lg leading-relaxed border-t border-border/50 pt-6">
                                {item.a.includes("👉 /services") ? (
                                  <>
                                    The platform offers multiple services,
                                    including personalized nutrition
                                    consultations, structured dietary programs,
                                    AI-assisted calorie tracking, and
                                    educational content. For a complete and
                                    up-to-date list of available services,
                                    please visit the Services page:{" "}
                                    <a
                                      href="/services"
                                      className="text-brand hover:underline font-medium"
                                    >
                                      👉 /services
                                    </a>
                                  </>
                                ) : (
                                  item.a
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
