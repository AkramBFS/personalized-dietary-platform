"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

const TRACK_HEIGHT = 160; // 160px fixed track height on desktop

export function ScrollProgressIndicator() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);

  const railContainerRef = useRef<HTMLElement>(null);
  const desktopFillRef = useRef<HTMLDivElement>(null);
  const mobileFillRef = useRef<HTMLDivElement>(null);

  const breakpointsRef = useRef<number[]>([0, 0, 0, 0, 0, 0]);
  const heroRangeThresholdRef = useRef<number>(0);
  const prevScrollYRef = useRef<number>(-1);
  const prevActiveChapterRef = useRef<number>(-1);
  const prevVisibilityStateRef = useRef<string>("");

  const computeBreakpoints = useCallback(() => {
    const ids = ["hero-ai-section", "services", "pricing", "faq-section", "cta", "newsletter"];
    const bps: number[] = [];

    ids.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) {
        const spacer = el.closest(".pin-spacer") as HTMLElement | null;
        const target = spacer || el;
        const rect = target.getBoundingClientRect();
        const top = Math.max(0, Math.round(rect.top + window.scrollY));
        bps.push(idx === 0 ? 0 : top);
      } else {
        bps.push(0);
      }
    });

    // Enforce non-decreasing breakpoints with minimum 1px gap
    for (let i = 1; i < bps.length; i++) {
      if (bps[i] <= bps[i - 1]) {
        bps[i] = bps[i - 1] + 1;
      }
    }

    breakpointsRef.current = bps;
    // Hero range dimming: scrollY < Services breakpoint - 0.5 * viewportHeight
    heroRangeThresholdRef.current = Math.max(0, bps[1] - 0.5 * window.innerHeight);
  }, []);

  useEffect(() => {
    computeBreakpoints();

    // Ensure calculation captures post-pin-spacer DOM tree
    const rafId = requestAnimationFrame(computeBreakpoints);
    const timer = setTimeout(computeBreakpoints, 250);

    // Recompute on ScrollTrigger refresh, resize, and window load
    ScrollTrigger.addEventListener("refresh", computeBreakpoints);
    window.addEventListener("resize", computeBreakpoints, { passive: true });
    window.addEventListener("load", computeBreakpoints, { passive: true });

    const onTick = () => {
      const scrollY = window.scrollY;
      if (scrollY === prevScrollYRef.current) return;
      prevScrollYRef.current = scrollY;

      // Self-heal cache if measured prematurely before pin spacers were created
      if (breakpointsRef.current[1] <= window.innerHeight && scrollY > 0) {
        computeBreakpoints();
      }

      const bps = breakpointsRef.current;
      const n = bps.length;
      if (n < 2) return;

      // 1. Piecewise linear mapping: exact dot i alignment when scroll reaches breakpoint i
      let fraction = 0;
      if (scrollY <= bps[0]) {
        fraction = 0;
      } else if (scrollY >= bps[n - 1]) {
        fraction = 1.0;
      } else {
        for (let i = 0; i < n - 1; i++) {
          if (scrollY >= bps[i] && scrollY < bps[i + 1]) {
            const segProgress = (scrollY - bps[i]) / (bps[i + 1] - bps[i]);
            fraction = (i + segProgress) / (n - 1);
            break;
          }
        }
      }

      // 2. Drive Desktop Fill (overflow-hidden revealer, fixed gradient child inside)
      if (desktopFillRef.current) {
        desktopFillRef.current.style.height = `${(fraction * 100).toFixed(2)}%`;
      }

      // 3. Drive Mobile Bottom Progress Line
      if (mobileFillRef.current) {
        mobileFillRef.current.style.transform = `scaleX(${fraction.toFixed(4)})`;
      }

      // 4. Active Chapter determination
      let currentActive = 0;
      for (let i = 0; i < n; i++) {
        if (scrollY >= bps[i]) {
          currentActive = i;
        }
      }
      if (currentActive !== prevActiveChapterRef.current) {
        prevActiveChapterRef.current = currentActive;
        setActiveChapter(currentActive);
      }

      // 5. Visibility & Hero Dimming state
      // Hidden until scrollY >= 200; subdued during hero range; full otherwise
      let vis = "hidden";
      if (scrollY >= 200) {
        vis = scrollY < heroRangeThresholdRef.current ? "subdued" : "full";
      }

      if (vis !== prevVisibilityStateRef.current) {
        prevVisibilityStateRef.current = vis;
        if (railContainerRef.current) {
          if (vis === "hidden") {
            railContainerRef.current.style.opacity = "0";
            railContainerRef.current.style.pointerEvents = "none";
          } else if (vis === "subdued") {
            railContainerRef.current.style.opacity = "0.25";
            railContainerRef.current.style.pointerEvents = "auto";
          } else {
            railContainerRef.current.style.opacity = "1";
            railContainerRef.current.style.pointerEvents = "auto";
          }
        }
      }
    };

    // Add to GSAP ticker (after Lenis raf)
    gsap.ticker.add(onTick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      gsap.ticker.remove(onTick);
      ScrollTrigger.removeEventListener("refresh", computeBreakpoints);
      window.removeEventListener("resize", computeBreakpoints);
      window.removeEventListener("load", computeBreakpoints);
    };
  }, [computeBreakpoints]);

  const jumpToChapter = (index: number) => {
    const targetY = breakpointsRef.current[index] ?? 0;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: targetY,
      behavior: isReduced ? "auto" : "smooth",
    });
  };

  return (
    <>
      {/* Mobile: 2px bottom line with safe-area inset (no dots or labels) */}
      <div
        id="scroll-progress-mobile"
        aria-hidden="true"
        className="md:hidden fixed bottom-0 left-0 right-0 h-0.5 z-[45] bg-white/10 pb-[env(safe-area-inset-bottom)] pointer-events-none"
      >
        <div
          ref={mobileFillRef}
          className="h-full w-full bg-gradient-to-r from-primary via-emerald-400 to-[#97E7CC] origin-left"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Desktop: Vertical progress rail with one geometry and bounded dots */}
      <nav
        id="scroll-progress-indicator"
        ref={railContainerRef}
        aria-label="Page scroll navigation"
        className="hidden md:flex fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-[45] items-center gap-3 opacity-0 pointer-events-none transition-opacity duration-150 motion-reduce:transition-none"
      >
        {/* Hover Tooltip */}
        {hoveredChapter !== null && (
          <div
            role="tooltip"
            className="py-1 px-2.5 rounded-md bg-card/90 text-foreground text-xs font-medium tracking-wide shadow-lg border border-border/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            {CHAPTERS[hoveredChapter].label}
          </div>
        )}

        {/* Bounded Track Box (exact dot 0 center to dot 5 center) */}
        <div
          className="relative w-6 flex items-center justify-center select-none"
          style={{ height: `${TRACK_HEIGHT}px` }}
        >
          {/* Track Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 rounded-full bg-white/10 backdrop-blur-xs overflow-hidden">
            {/* Active Fill Revealer (unmasks fixed gradient child without stretching) */}
            <div
              ref={desktopFillRef}
              className="absolute top-0 left-0 right-0 w-full rounded-full overflow-hidden"
              style={{ height: "0%" }}
            >
              <div
                className="w-full bg-gradient-to-b from-primary via-emerald-400 to-[#97E7CC]"
                style={{ height: `${TRACK_HEIGHT}px` }}
              />
            </div>
          </div>

          {/* Chapter Ticks (positioned absolutely at i / (n - 1) * 100%) */}
          {CHAPTERS.map((ch, idx) => {
            const isActive = idx === activeChapter;
            const topPercent = (idx / (CHAPTERS.length - 1)) * 100;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jumpToChapter(idx)}
                onMouseEnter={() => setHoveredChapter(idx)}
                onMouseLeave={() => setHoveredChapter(null)}
                aria-label={`Jump to ${ch.label}`}
                aria-current={isActive ? "step" : undefined}
                className="group absolute left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none cursor-pointer"
                style={{ top: `${topPercent}%` }}
              >
                <span
                  className={`size-1.5 rounded-full transition-transform duration-200 motion-reduce:transition-none ${
                    isActive
                      ? "scale-125 bg-primary shadow-[0_0_8px_rgba(80,205,149,0.8)]"
                      : "bg-white/40 group-hover:scale-110 group-hover:bg-white/80"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default ScrollProgressIndicator;
