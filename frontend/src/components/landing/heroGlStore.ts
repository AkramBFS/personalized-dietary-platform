/**
 * Tiny external store shared by the hero GL transition, the fog bridge
 * (fallback) and the Services arrival animation.
 *
 *  - "pending":  GL not (yet) available -> fog bridge visible, scrubbed arrival.
 *  - "ready":    GL transition is live  -> fog bridge hidden, reveal-on-handoff.
 *  - "fallback": GL unavailable/failed  -> same visuals as "pending".
 */
export type HeroGlStatus = "pending" | "ready" | "fallback";

let status: HeroGlStatus = "pending";
const subscribers = new Set<() => void>();

export function getHeroGlStatus(): HeroGlStatus {
  return status;
}

export function isHeroGlReady(): boolean {
  return status === "ready";
}

export function setHeroGlStatus(next: HeroGlStatus): void {
  if (next === status) return;
  status = next;
  subscribers.forEach((fn) => fn());
}

export function subscribeHeroGl(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
