"use client";

import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import 'lenis/dist/lenis.css';

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    const lenisInstance = lenisRef.current?.lenis;
    if (!lenisInstance) return;

    // 1. Sync ScrollTrigger with Lenis
    lenisInstance.on('scroll', ScrollTrigger.update);

    // 2. Create a scoped ticker function to update Lenis on every GSAP tick
    const updateTime = (time: number) => {
      lenisInstance.raf(time * 1000);
    };
    
    // 3. Add Lenis update function to GSAP's global ticker
    gsap.ticker.add(updateTime);

    // 4. Disable GSAP's lag smoothing to keep ScrollTrigger and Lenis perfectly synced
    gsap.ticker.lagSmoothing(0);

    // 5. CRITICAL CLEANUP: Unbind events and remove ticker on unmount
    return () => {
      gsap.ticker.remove(updateTime);
      lenisInstance.off('scroll', ScrollTrigger.update);
    };
  }, []);

  return (
    <ReactLenis 
      ref={lenisRef}
      root 
      options={{ 
        lerp: 0.08,             // Slightly lower lerp = smoother scroll, lower CPU load
        duration: 1.2, 
        smoothWheel: true,
        syncTouch: false,        // Prevents heavy mobile touch emulation stutter
        allowNestedScroll: false // CRITICAL: Turn off recursive nested DOM scanning for major performance boost
      }}
    >
      {children}
    </ReactLenis>
  );
}
