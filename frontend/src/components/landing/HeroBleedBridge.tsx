import React from "react";

// 21-stop smootherstep alpha ramp from 0% to 55%, solid canvas from 55% to 100%
const FOG_GRADIENT = `linear-gradient(
  to bottom,
  color-mix(in srgb, var(--background) 0%, transparent) 0%,
  color-mix(in srgb, var(--background) 0.12%, transparent) 2.75%,
  color-mix(in srgb, var(--background) 0.86%, transparent) 5.5%,
  color-mix(in srgb, var(--background) 2.66%, transparent) 8.25%,
  color-mix(in srgb, var(--background) 5.79%, transparent) 11%,
  color-mix(in srgb, var(--background) 10.35%, transparent) 13.75%,
  color-mix(in srgb, var(--background) 16.31%, transparent) 16.5%,
  color-mix(in srgb, var(--background) 23.52%, transparent) 19.25%,
  color-mix(in srgb, var(--background) 31.74%, transparent) 22%,
  color-mix(in srgb, var(--background) 40.69%, transparent) 24.75%,
  color-mix(in srgb, var(--background) 50%, transparent) 27.5%,
  color-mix(in srgb, var(--background) 59.31%, transparent) 30.25%,
  color-mix(in srgb, var(--background) 68.26%, transparent) 33%,
  color-mix(in srgb, var(--background) 76.48%, transparent) 35.75%,
  color-mix(in srgb, var(--background) 83.69%, transparent) 38.5%,
  color-mix(in srgb, var(--background) 89.65%, transparent) 41.25%,
  color-mix(in srgb, var(--background) 94.21%, transparent) 44%,
  color-mix(in srgb, var(--background) 97.34%, transparent) 46.75%,
  color-mix(in srgb, var(--background) 99.14%, transparent) 49.5%,
  color-mix(in srgb, var(--background) 99.88%, transparent) 52.25%,
  var(--background) 55%,
  var(--background) 100%
)`;

const NOISE_MASK = `linear-gradient(
  to bottom,
  transparent 0%,
  transparent 10%,
  black 25%,
  black 45%,
  transparent 55%,
  transparent 100%
)`;

export function HeroBleedBridge() {
  return (
    <div
      id="hero-bleed-bridge"
      aria-hidden="true"
      className="relative z-20 w-full h-[26vh] -mt-[26vh] overflow-hidden pointer-events-none select-none"
      style={{
        background: FOG_GRADIENT,
      }}
    >
      {/* Tapered neutral noise: absent over transparent top and solid bottom */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          maskImage: NOISE_MASK,
          WebkitMaskImage: NOISE_MASK,
        }}
      >
        <svg
          className="w-full h-full opacity-[0.035] pointer-events-none"
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
    </div>
  );
}

export default HeroBleedBridge;
