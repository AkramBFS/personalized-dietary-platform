import React from "react";

export function HeroBleedBridge() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full h-[24vh] overflow-hidden pointer-events-none select-none z-10"
      style={{
        background:
          "linear-gradient(to bottom, var(--hero-bleed-edge), var(--background))",
      }}
    >
      {/* Subtle dither/noise overlay: blend-mode normal, opacity 0.035 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="hero-bleed-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-bleed-noise)" />
      </svg>
    </div>
  );
}

export default HeroBleedBridge;
