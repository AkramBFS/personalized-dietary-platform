"use client";

import React, { useEffect, useState, useCallback } from "react";

interface Chapter {
  id: string;
  label: string;
}

const CHAPTERS: Chapter[] = [
  { id: "hero-ai-section", label: "Hero" },
  { id: "services", label: "Services" },
  { id: "pricing", label: "Pricing" },
  { id: "faq-section", label: "FAQs" },
  { id: "cta", label: "Get Started" },
  { id: "newsletter", label: "Newsletter" },
];

export function ScrollProgressIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isHeroRange, setIsHeroRange] = useState(true);
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);

  const updateScroll = useCallback(() => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;

    const progress =
      totalHeight > 0
        ? Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100))
        : 0;
    setScrollProgress(progress);

    // Hero range check: hero section ends around 4000 + innerHeight
    // While in early hero, subdue the indicator
    const heroSection = document.getElementById("hero-ai-section");
    if (heroSection) {
      const heroRect = heroSection.getBoundingClientRect();
      setIsHeroRange(heroRect.bottom > window.innerHeight * 0.5);
    } else {
      setIsHeroRange(currentScroll < 1000);
    }

    // Determine active chapter
    let currentActive = 0;
    CHAPTERS.forEach((ch, idx) => {
      const el = document.getElementById(ch.id);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= window.innerHeight * 0.5) {
          currentActive = idx;
        }
      }
    });
    setActiveChapter(currentActive);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    const rafId = requestAnimationFrame(updateScroll);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [updateScroll]);

  const scrollToChapter = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside
      id="scroll-progress-indicator"
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-40 flex items-center gap-3 transition-opacity duration-500 motion-reduce:hidden ${
        isHeroRange ? "opacity-0 md:opacity-25 pointer-events-none md:pointer-events-auto" : "opacity-100 pointer-events-auto"
      }`}
    >
      {/* Chapter Hover Tooltip */}
      {hoveredChapter !== null && (
        <div
          role="tooltip"
          className="hidden md:block py-1 px-2.5 rounded-md bg-card/90 text-foreground text-xs font-medium tracking-wide shadow-lg border border-border/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {CHAPTERS[hoveredChapter].label}
        </div>
      )}

      {/* Progress Track & Fill */}
      <div className="relative h-44 w-6 flex items-center justify-center">
        {/* Track Line */}
        <div className="absolute h-full w-1 rounded-full bg-white/10 backdrop-blur-xs overflow-hidden">
          {/* Active Fill */}
          <div
            className="w-full bg-gradient-to-b from-primary via-emerald-400 to-[#97E7CC] rounded-full transition-[height] duration-100 ease-out"
            style={{ height: `${scrollProgress}%` }}
          />
        </div>

        {/* Chapter Ticks */}
        <div className="absolute inset-y-0 w-full flex flex-col justify-between items-center py-1">
          {CHAPTERS.map((ch, idx) => {
            const isActive = idx === activeChapter;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => scrollToChapter(ch.id)}
                onMouseEnter={() => setHoveredChapter(idx)}
                onMouseLeave={() => setHoveredChapter(null)}
                aria-label={`Jump to ${ch.label}`}
                className={`group relative flex items-center justify-center size-3.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? "scale-125" : "hover:scale-110"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full transition-colors duration-200 ${
                    isActive
                      ? "bg-primary shadow-[0_0_8px_rgba(80,205,149,0.8)]"
                      : "bg-white/40 group-hover:bg-white/80"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default ScrollProgressIndicator;
