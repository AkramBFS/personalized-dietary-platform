"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Cpu,
  Eye,
  FileEdit,
  Trash2,
  ShieldCheck,
  Database,
  LayoutGrid,
} from "lucide-react";

const navLinks = [
  { id: "overview", label: "01 Overview" },
  { id: "taxonomy", label: "02 Taxonomy" },
  { id: "utility", label: "03 Utility" },
  { id: "governance", label: "04 Neural Governance" },
  { id: "sovereignty", label: "05 Sovereignty" },
  { id: "agency", label: "06 Agency" },
  { id: "contact", label: "07 Contact" },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string>("overview");

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

  return (
    <main className="pt-24 md:pt-48 pb-32 px-8 md:px-24 max-w-7xl mx-auto selection:bg-[#3DDC97]/30 min-h-screen text-card-foreground">
      {/* Header Section */}
      <header className="max-w-4xl mb-32">
        <div className="text-[#3DDC97] uppercase tracking-[0.3em] text-sm mb-6 font-semibold">
          Data Protection Framework
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-12">
          Privacy <span className="text-[#3DDC97]">Policy</span>
        </h1>
        <p className="text-[#c0c8c8] text-xl md:text-2xl font-light leading-relaxed max-w-2xl">
          Explaining the collection, processing, and protection of information
          within the SVMB dietary assessment ecosystem.
        </p>
        <div className="mt-12 flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-[#c0c8c8]/60">
          <span>Official Release</span>
          <span className="w-8 h-px bg-[#414848]"></span>
          <span className="text-card-foreground">April 2026</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
        {/* Sticky Sidebar Navigation */}
        <aside className="hidden md:block md:col-span-3 sticky top-48 self-start">
          <nav className="flex flex-col gap-6 text-xs uppercase tracking-widest border-l border-[#414848] pl-6 font-semibold">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
                className={`transition-all duration-300 ${
                  activeSection === link.id
                    ? "text-[#3DDC97] font-bold scale-105 origin-left"
                    : "text-[#c0c8c8]/60 hover:text-[#3DDC97]"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content Articles */}
        <article className="md:col-span-9 max-w-3xl space-y-32">
          {/* 01 Overview — Introduction */}
          <section className="scroll-mt-48" id="overview">
            <div className="flex flex-col gap-8">
              <div className="text-xs text-[#3DDC97]/60 uppercase tracking-widest font-semibold">
                01 / Introduction
              </div>
              <h2 className="text-3xl font-bold">Overview</h2>
              <div className="text-lg text-[#c0c8c8] leading-relaxed space-y-6">
                <p>
                  At SVMB, we consider personal health data to be deeply
                  sensitive and fundamentally sovereign. This Privacy Policy
                  explains how we collect, process, and protect information
                  entrusted to us within the context of personalized dietary
                  assessment and AI-assisted calorie tracking.
                </p>
                <p>
                  By using our services, you agree to the data practices
                  described in this document. We do not sell personal data. We
                  do not engage in invasive advertising or behavioral profiling.
                  All data processing exists solely to support nutrition
                  guidance, health awareness, and system reliability.
                </p>
              </div>
            </div>
          </section>

          {/* 02 Taxonomy — Information We Collect */}
          <section className="scroll-mt-48" id="taxonomy">
            <div className="flex flex-col gap-8">
              <div className="text-xs text-[#3DDC97]/60 uppercase tracking-widest font-semibold">
                02 / Data Classification
              </div>
              <h2 className="text-3xl font-bold">Taxonomy</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="group p-6 bg-accent rounded-xl border border-[#414848] transition-colors hover:bg-[#1c5a64]">
                  <h3 className="text-[#3DDC97] text-sm uppercase tracking-wider mb-3 font-semibold">
                    Personal Data
                  </h3>
                  <p className="text-[#c0c8c8] text-sm leading-relaxed">
                    Basic identity information such as full name, email address,
                    age, gender, and account credentials required for secure
                    access, communication, and personalized follow-up.
                  </p>
                </div>
                <div className="group p-6 bg-accent rounded-xl border border-[#414848] transition-colors hover:bg-[#1c5a64]">
                  <h3 className="text-[#3DDC97] text-sm uppercase tracking-wider mb-3 font-semibold">
                    Health & Lifestyle Data
                  </h3>
                  <p className="text-[#c0c8c8] text-sm leading-relaxed">
                    User-provided health indicators including height, weight,
                    activity level, dietary preferences, medical conditions
                    (when disclosed), and wellness goals used to personalize
                    nutrition guidance.
                  </p>
                </div>
                <div className="group p-6 bg-accent rounded-xl border border-[#414848] transition-colors hover:bg-[#1c5a64]">
                  <h3 className="text-[#3DDC97] text-sm uppercase tracking-wider mb-3 font-semibold">
                    AI & Food Images
                  </h3>
                  <p className="text-[#c0c8c8] text-sm leading-relaxed">
                    Meal images voluntarily uploaded for AI-assisted food
                    recognition and calorie estimation. Images are processed
                    temporarily and are not stored beyond the analysis
                    lifecycle.
                  </p>
                </div>
                <div className="group p-6 bg-accent rounded-xl border border-[#414848] transition-colors hover:bg-[#1c5a64]">
                  <h3 className="text-[#3DDC97] text-sm uppercase tracking-wider mb-3 font-semibold">
                    Technical Metadata
                  </h3>
                  <p className="text-[#c0c8c8] text-sm leading-relaxed">
                    Device information, IP address, session identifiers, and
                    usage logs required for security, fraud prevention, system
                    diagnostics, and service optimization.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 03 Utility — How We Use Information */}
          <section className="scroll-mt-48" id="utility">
            <div className="flex flex-col gap-8">
              <div className="text-xs text-[#3DDC97]/60 uppercase tracking-widest font-semibold">
                03 / Purpose
              </div>
              <h2 className="text-3xl font-bold">Utility</h2>

              <ul className="space-y-5 mt-4 text-[#c0c8c8] leading-relaxed">
                <li className="flex gap-4 items-start">
                  <CheckCircle
                    className="text-[#3DDC97] mt-1 shrink-0"
                    size={20}
                  />
                  <span>
                    To deliver personalized dietary recommendations, nutrition
                    plans, and calorie tracking features.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <CheckCircle
                    className="text-[#3DDC97] mt-1 shrink-0"
                    size={20}
                  />
                  <span>
                    To operate and maintain AI-assisted food recognition and
                    estimation services.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <CheckCircle
                    className="text-[#3DDC97] mt-1 shrink-0"
                    size={20}
                  />
                  <span>
                    To manage user accounts, subscriptions, and secure access.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <CheckCircle
                    className="text-[#3DDC97] mt-1 shrink-0"
                    size={20}
                  />
                  <span>
                    To support communication between users, nutritionists, and
                    administrators.
                  </span>
                </li>
                <li className="flex gap-4 items-start">
                  <CheckCircle
                    className="text-[#3DDC97] mt-1 shrink-0"
                    size={20}
                  />
                  <span>
                    To improve platform accuracy, usability, and overall service
                    quality.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* 04 Neural Governance — AI Disclaimer */}
          <section className="scroll-mt-48" id="governance">
            <div className="relative p-12 bg-accent rounded-xl overflow-hidden group border border-[#414848] shadow-lg">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <Cpu className="text-[#3DDC97]" size={160} />
              </div>
              <div className="relative z-10 flex flex-col gap-8">
                <div className="text-xs text-[#3DDC97] uppercase tracking-widest font-semibold">
                  04 / AI Ethics
                </div>
                <h2 className="text-3xl font-bold">Neural Governance</h2>

                <div className="text-lg text-[#c0c8c8] leading-relaxed space-y-6">
                  <p>
                    This platform uses artificial intelligence, including
                    computer vision and machine learning models, to assist users
                    in estimating meal calories and understanding food
                    composition. AI results are provided for educational and
                    self-monitoring purposes only and should not be interpreted
                    as medical diagnoses.
                  </p>
                  <p>
                    Calorie estimations are inherently approximate and may vary
                    based on image quality, portion size, and food preparation.
                  </p>
                  <div className="p-6 bg-[#3DDC97]/10 border-l-2 border-[#3DDC97] rounded-r-lg text-card-foreground font-medium">
                    Personal health data and meal images are never used to train
                    public or third-party AI models. All processing remains
                    confined to this platform’s controlled environment.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 05 Sovereignty — Data Sharing & Storage */}
          <section className="scroll-mt-48" id="sovereignty">
            <div className="flex flex-col gap-8">
              <div className="text-xs text-[#3DDC97]/60 uppercase tracking-widest font-semibold">
                05 / Security
              </div>
              <h2 className="text-3xl font-bold">Sovereignty</h2>
              <p className="text-[#c0c8c8] leading-relaxed">
                We do not sell or commercialize personal or health data.
                Information is shared only when strictly necessary to operate
                the platform or comply with legal obligations.
              </p>

              <div className="bg-accent p-8 rounded-xl border border-[#414848] space-y-6 text-[#c0c8c8]">
                <div className="flex gap-4">
                  <LayoutGrid className="text-[#3DDC97] shrink-0" size={24} />
                  <div>
                    <strong className="text-card-foreground block mb-1">
                      Service Providers
                    </strong>
                    <p className="text-sm">
                      Secure cloud infrastructure, payment processors, and
                      analytics services operating under strict confidentiality
                      agreements.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <ShieldCheck className="text-[#3DDC97] shrink-0" size={24} />
                  <div>
                    <strong className="text-card-foreground block mb-1">
                      Legal Compliance
                    </strong>
                    <p className="text-sm">
                      Disclosure only when required by applicable laws or
                      regulatory authorities.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Database className="text-[#3DDC97] shrink-0" size={24} />
                  <div>
                    <strong className="text-card-foreground block mb-1">
                      Security
                    </strong>
                    <p className="text-sm">
                      All sensitive data is encrypted in transit and at rest
                      using industry-standard security practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 06 Agency — User Rights & Retention */}
          <section className="scroll-mt-48" id="agency">
            <div className="flex flex-col gap-8">
              <div className="text-xs text-[#3DDC97]/60 uppercase tracking-widest font-semibold">
                06 / Control
              </div>
              <h2 className="text-3xl font-bold">Agency</h2>
              <p className="text-[#c0c8c8] leading-relaxed">
                Depending on your jurisdiction, you have the right to control
                your personal data and how it is processed.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="flex flex-col items-center justify-center p-8 bg-accent rounded-xl text-center border border-[#414848] hover:bg-[#1c5a64] transition-colors cursor-pointer group">
                  <Eye
                    className="text-[#3DDC97] mb-4 group-hover:scale-110 transition-transform"
                    size={32}
                  />
                  <span className="text-sm uppercase tracking-wider font-semibold text-card-foreground">
                    Access
                  </span>
                  <p className="text-[10px] text-[#c0c8c8]/60 mt-2">
                    Request copies of health data
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-8 bg-accent rounded-xl text-center border border-[#414848] hover:bg-[#1c5a64] transition-colors cursor-pointer group">
                  <FileEdit
                    className="text-[#3DDC97] mb-4 group-hover:scale-110 transition-transform"
                    size={32}
                  />
                  <span className="text-sm uppercase tracking-wider font-semibold text-card-foreground">
                    Correction
                  </span>
                  <p className="text-[10px] text-[#c0c8c8]/60 mt-2">
                    Update inaccurate info
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-8 bg-accent rounded-xl text-center border border-[#414848] hover:bg-[#1c5a64] transition-colors cursor-pointer group">
                  <Trash2
                    className="text-[#3DDC97] mb-4 group-hover:scale-110 transition-transform"
                    size={32}
                  />
                  <span className="text-sm uppercase tracking-wider font-semibold text-card-foreground">
                    Deletion
                  </span>
                  <p className="text-[10px] text-[#c0c8c8]/60 mt-2">
                    Request account removal
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-10">
                <div>
                  <h3 className="text-xl font-bold mb-3">Cookies & Tracking</h3>
                  <p className="text-[#c0c8c8] text-sm leading-relaxed">
                    We use essential cookies only to maintain secure sessions
                    and core platform functionality. No third-party advertising
                    or tracking cookies are used.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3">Children’s Privacy</h3>
                  <p className="text-[#c0c8c8] text-sm leading-relaxed">
                    This platform is not intended for individuals under the age
                    of 18. We do not knowingly collect personal or health data
                    from minors.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 07 Contact — Contact Inquiries */}
          <section className="scroll-mt-48" id="contact">
            <div className="bg-accent p-12 rounded-xl border border-[#3DDC97]/20 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Contact Inquiries</h2>
                  <p className="text-[#c0c8c8] max-w-sm">
                    For privacy questions, data access requests, or concerns
                    related to personal health information, please contact us.
                  </p>
                </div>
                <a
                  href="mailto:privacy@svmb-app.com"
                  className="px-8 py-4 bg-[#3DDC97] text-[#082E35] text-xs uppercase tracking-widest rounded-sm hover:brightness-110 transition-all font-bold"
                >
                  privacy@svmb-app.com
                </a>
              </div>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
