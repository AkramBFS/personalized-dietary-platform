"use client";

import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import 'lenis/dist/lenis.css';

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    // 1. Create a scoped ticker function
    const updateTime = (time: number) => {
      if (lenisRef.current?.lenis) {
        lenisRef.current.lenis.raf(time * 1000);
      }
    };
    
    // 2. Add it to GSAP's global ticker
    gsap.ticker.add(updateTime);

    // 3. CRITICAL CLEANUP: Kill the ticker when this component unmounts
    return () => {
      gsap.ticker.remove(updateTime);
    };
  }, []);

  return (
    <ReactLenis 
      ref={lenisRef}
      root 
      options={{ 
        lerp: 0.08,        // Slightly lower lerp = smoother, less CPU intensive
        duration: 1.2, 
        smoothWheel: true,
        syncTouch: false   // Prevents heavy mobile touch emulation lag
      }}
    >
      {children}
    </ReactLenis>
  );
}
