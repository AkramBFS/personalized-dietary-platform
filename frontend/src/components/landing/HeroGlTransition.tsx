"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setHeroGlStatus } from "./heroGlStore";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ------------------------------------------------------------------ */
/* Tunables                                                            */
/* ------------------------------------------------------------------ */
const STILL_SRC = "/branding/final-frame.png";
/** Aspect the still is mapped with (cover). Natural still is 1376x768. */
const STILL_ASPECT = 1376 / 768;
/** Cross-in window, in viewport-heights, ending exactly at E. */
const CROSS_IN_VH = 0.04;
const MAX_DPR_DESKTOP = 2;
const MAX_DPR_MOBILE = 1.5;
/** If Services' pin start differs from E + V by more than this, GL is skipped. */
const MAX_HANDOFF_DELTA_PX = 2;

type OglModule = typeof import("ogl");

interface Geometry {
  /** Hero pin end (scroll px). */
  E: number;
  /** Transition end = Services pin start (scroll px). */
  end: number;
  /** Viewport height used for the assertion. */
  V: number;
  /** Cross-in start (scroll px). */
  crossStart: number;
  /** Services pin start - (E + V). */
  delta: number;
}

interface GlState {
  canvas: HTMLCanvasElement;
  gl: InstanceType<OglModule["Renderer"]>["gl"];
  renderer: InstanceType<OglModule["Renderer"]>;
  program: InstanceType<OglModule["Program"]>;
  mesh: InstanceType<OglModule["Mesh"]>;
  geometry: InstanceType<OglModule["Triangle"]>;
  texture: InstanceType<OglModule["Texture"]>;
  resizeObserver: ResizeObserver;
  onLost: (e: Event) => void;
  onRestored: () => void;
}

/* ------------------------------------------------------------------ */
/* Shaders (WebGL2). Pure function of uProgress + uAlpha: no time.     */
/* ------------------------------------------------------------------ */
const VERTEX = /* glsl */ `#version 300 es
in vec2 uv;
in vec2 position;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D tMap;
uniform vec3 uPlate;
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uProgress;
uniform float uAlpha;

in vec2 vUv;
out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Normalised to [0, 1].
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.7);
    a *= 0.5;
  }
  return clamp(v / 0.9375, 0.0, 1.0);
}

// Matches object-fit: cover, object-position: 50% 50%.
vec2 coverUv(vec2 uv) {
  float rs = uRes.x / uRes.y;
  vec2 s = rs > uImgAspect ? vec2(1.0, uImgAspect / rs) : vec2(rs / uImgAspect, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);
  float e = p * p * (3.0 - 2.0 * p);

  // Displacement envelope: exactly 0 at p = 0 (undistorted still) and ~0 at p = 1.
  float env = smoothstep(0.0, 0.18, p) * (1.0 - smoothstep(0.55, 0.95, p));

  float aspect = uRes.x / uRes.y;
  vec2 c = vUv - 0.5;
  c.x *= aspect;
  float r = length(c);
  vec2 dir = r > 1e-4 ? c / r : vec2(0.0);
  dir.x /= aspect;

  float ripple = sin(r * 22.0 - e * 16.0);
  vec2 nd = vec2(fbm(vUv * 3.0 + vec2(3.1, 1.7)), fbm(vUv * 3.0 + vec2(7.3, 5.2))) - 0.5;
  vec2 disp = (dir * ripple * 0.010 + nd * 0.040) * env;

  // Slight push-in about the centre.
  float zoom = 1.0 - 0.06 * e;
  vec2 suv = (vUv - 0.5) * zoom + 0.5 + disp;

  // Very restrained RGB shift along the displacement direction.
  vec2 sh = (dir * 0.0022 + nd * 0.0030) * env;
  float cr = texture(tMap, coverUv(suv + sh)).r;
  float cg = texture(tMap, coverUv(suv)).g;
  float cb = texture(tMap, coverUv(suv - sh)).b;
  vec3 still = vec3(cr, cg, cb);

  // Noise-driven dissolve front into the plate. n is in [0, 1].
  float n = smoothstep(0.15, 0.85, fbm(vUv * vec2(aspect, 1.0) * 2.2 + 11.3));
  float w = 0.12;
  float th = mix(-w, 1.0 + w, e);
  float plateAmt = 1.0 - smoothstep(th - w, th + w, n);

  vec3 col = mix(still, uPlate, plateAmt);

  // Static grain: zero at p = 0 and zero once dissolved into the plate.
  float g = (hash21(floor(gl_FragCoord.xy)) - 0.5) * 0.018 * env * (1.0 - plateAmt);
  col += g;

  // Pass-through output (premultiplied for the canvas compositor).
  outColor = vec4(col * uAlpha, uAlpha);
}
`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const smooth01 = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

function compileOk(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  src: string,
): boolean {
  const shader = gl.createShader(type);
  if (!shader) return false;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  const ok = !!gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  gl.deleteShader(shader);
  return ok;
}

function parseCssColor(css: string): [number, number, number] | null {
  const m = css.match(/rgba?\(\s*(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)/);
  if (m) return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
  // Any other CSS color syntax: let the browser resolve it.
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = 1;
  const ctx = cvs.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}

function isFlagOff(): boolean {
  try {
    if (process.env.NEXT_PUBLIC_HERO_GL === "off") return true;
    const q = new URLSearchParams(window.location.search).get("hero-gl");
    return q === "off";
  } catch {
    return false;
  }
}

function prefersSaveData(): boolean {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  return !!conn?.saveData;
}

/* ------------------------------------------------------------------ */
/* Controller                                                          */
/* ------------------------------------------------------------------ */
function createController(host: HTMLElement) {
  let destroyed = false;
  let generation = 0;
  let state: GlState | null = null;
  let geo: Geometry | null = null;
  let plate: [number, number, number] = [0, 0, 0];
  let lastY = Number.NaN;
  let dirty = true;
  let visible = false;
  let tickerAttached = false;
  let idleHandle: number | null = null;

  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mqMobile = window.matchMedia("(max-width: 767px)");

  const debug = {
    status: "pending" as string,
    failReason: "" as string,
    renderCount: 0,
    geo: null as Geometry | null,
    plate: [0, 0, 0] as number[],
    visible: false,
    lastProgress: 0,
    lastAlpha: 0,
    dpr: 1,
  };
  (window as unknown as { __heroGl?: typeof debug }).__heroGl = debug;

  const setStatus = (s: "pending" | "ready" | "fallback", reason = "") => {
    debug.status = s;
    if (reason) debug.failReason = reason;
    setHeroGlStatus(s);
  };

  /* ---------- geometry (read-only against locked triggers) ---------- */
  const computeGeometry = () => {
    const hero = document.getElementById("hero-ai-section");
    const services = document.getElementById("services");
    if (!hero || !services) {
      geo = null;
      return;
    }
    const all = ScrollTrigger.getAll();
    const heroST = all.find((st) => st.pin === hero);
    const svcST = all.find(
      (st) =>
        st.pin === services ||
        (st.pin instanceof HTMLElement && st.pin.contains(services)),
    );
    if (!heroST || !svcST) {
      geo = null;
      return;
    }
    const V = window.innerHeight;
    const E = heroST.end;
    const end = svcST.start;
    geo = {
      E,
      end,
      V,
      crossStart: E - CROSS_IN_VH * V,
      delta: end - (E + V),
    };
    debug.geo = geo;

    const bg = parseCssColor(getComputedStyle(services).backgroundColor);
    if (bg) {
      plate = bg;
      debug.plate = bg;
    }
    dirty = true;
  };

  /* ---------- canvas visibility ---------- */
  const setVisible = (v: boolean) => {
    if (!state || visible === v) return;
    visible = v;
    debug.visible = v;
    state.canvas.style.display = v ? "block" : "none";
    state.canvas.style.pointerEvents = v ? "auto" : "none";
  };

  /* ---------- drawing ---------- */
  const draw = (progress: number, alpha: number) => {
    if (!state) return;
    const { program, renderer, mesh } = state;
    program.uniforms.uProgress.value = progress;
    program.uniforms.uAlpha.value = alpha;
    program.uniforms.uPlate.value = plate;
    program.uniforms.uRes.value = [renderer.gl.canvas.width, renderer.gl.canvas.height];
    renderer.render({ scene: mesh });
    debug.renderCount++;
  };

  const tick = () => {
    if (!state || !geo) return;
    const y = window.scrollY;
    if (y === lastY && !dirty) return;
    lastY = y;
    dirty = false;

    if (y <= geo.crossStart || y >= geo.end) {
      setVisible(false);
      return;
    }
    const alpha = smooth01((y - geo.crossStart) / (geo.E - geo.crossStart));
    const progress = Math.min(1, Math.max(0, (y - geo.E) / (geo.end - geo.E)));
    debug.lastAlpha = alpha;
    debug.lastProgress = progress;
    setVisible(true);
    draw(progress, alpha);
  };

  const attachTicker = () => {
    if (tickerAttached) return;
    gsap.ticker.add(tick);
    tickerAttached = true;
  };
  const detachTicker = () => {
    if (!tickerAttached) return;
    gsap.ticker.remove(tick);
    tickerAttached = false;
  };

  /* ---------- lifecycle ---------- */
  const disposeGl = (loseContext: boolean) => {
    detachTicker();
    const s = state;
    state = null;
    visible = false;
    debug.visible = false;
    if (!s) return;
    s.resizeObserver.disconnect();
    s.canvas.removeEventListener("webglcontextlost", s.onLost);
    s.canvas.removeEventListener("webglcontextrestored", s.onRestored);
    try {
      const gl = s.gl;
      gl.deleteTexture(s.texture.texture);
      gl.deleteProgram(s.program.program);
      Object.values(s.geometry.attributes).forEach((a) => {
        if (a.buffer) gl.deleteBuffer(a.buffer);
      });
      if (loseContext) gl.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* context may already be lost */
    }
    s.canvas.remove();
  };

  const fallback = (reason: string) => {
    generation++;
    disposeGl(true);
    setStatus("fallback", reason);
  };

  const initGl = async () => {
    const my = ++generation;
    const stale = () => destroyed || my !== generation;

    let ogl: OglModule;
    try {
      ogl = await import("ogl");
    } catch {
      if (!stale()) fallback("ogl-import-failed");
      return;
    }
    if (stale()) return;

    // 1. Context
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100vh",
      zIndex: "42",
      display: "none",
      pointerEvents: "none",
    });

    let renderer: InstanceType<OglModule["Renderer"]>;
    try {
      renderer = new ogl.Renderer({
        canvas,
        webgl: 2,
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        dpr: Math.min(
          window.devicePixelRatio || 1,
          mqMobile.matches ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP,
        ),
      });
    } catch {
      if (!stale()) fallback("no-webgl-context");
      return;
    }
    if (!renderer.isWebgl2) {
      if (!stale()) fallback("webgl2-unavailable");
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    // 2. Shader pre-validation (keeps console clean on failure)
    if (
      !compileOk(gl, gl.VERTEX_SHADER, VERTEX) ||
      !compileOk(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    ) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (!stale()) fallback("shader-compile-failed");
      return;
    }

    // 3. Still
    const image = new Image();
    image.decoding = "async";
    image.src = STILL_SRC;
    try {
      await image.decode();
    } catch {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (!stale()) fallback("still-load-failed");
      return;
    }
    if (stale()) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return;
    }

    // 4. Resources
    const texture = new ogl.Texture(gl, {
      image,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      generateMipmaps: false,
      flipY: true,
    });
    const geometry = new ogl.Triangle(gl);
    const program = new ogl.Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        tMap: { value: texture },
        uPlate: { value: plate },
        uRes: { value: [1, 1] },
        uImgAspect: { value: STILL_ASPECT },
        uProgress: { value: 0 },
        uAlpha: { value: 0 },
      },
    });
    if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (!stale()) fallback("program-link-failed");
      return;
    }
    const mesh = new ogl.Mesh(gl, { geometry, program });

    const applySize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.dpr = Math.min(
        window.devicePixelRatio || 1,
        mqMobile.matches ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP,
      );
      debug.dpr = renderer.dpr;
      renderer.setSize(w, h);
      dirty = true;
    };
    const resizeObserver = new ResizeObserver(applySize);

    const onLost = (e: Event) => {
      e.preventDefault();
      // Fog bridge takes over immediately; rebuilt on restore.
      setStatus("fallback", "context-lost");
      visible = false;
      debug.visible = false;
      canvas.style.display = "none";
      canvas.style.pointerEvents = "none";
      detachTicker();
    };
    const onRestored = () => {
      if (destroyed || mqReduce.matches) return;
      generation++;
      disposeGl(false);
      void initGl();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    host.appendChild(canvas);
    resizeObserver.observe(canvas);
    state = {
      canvas,
      gl,
      renderer,
      program,
      mesh,
      geometry,
      texture,
      resizeObserver,
      onLost,
      onRestored,
    };

    // 5. Warm-up: upload texture + compile/link on the GPU while hidden.
    computeGeometry();
    applySize();
    draw(0.5, 1);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    debug.renderCount = 0;

    if (stale()) return;
    attachTicker();
    maybeReady();
  };

  const maybeReady = () => {
    if (!state || destroyed) return;
    if (!geo) return; // wait for ScrollTrigger refresh to expose geometry
    if (Math.abs(geo.delta) > MAX_HANDOFF_DELTA_PX) {
      fallback("handoff-mismatch");
      return;
    }
    lastY = Number.NaN;
    dirty = true;
    setStatus("ready");
    tick(); // compute progress from the current scroll immediately (reload-in-window)
  };

  const onRefresh = () => {
    computeGeometry();
    if (state && !geo) return;
    maybeReady();
  };

  const onReduceChange = () => {
    if (destroyed) return;
    if (mqReduce.matches) {
      fallback("reduced-motion");
    } else {
      start();
    }
  };

  const start = () => {
    if (destroyed) return;
    if (isFlagOff()) return setStatus("fallback", "flag-off");
    if (mqReduce.matches) return setStatus("fallback", "reduced-motion");
    if (prefersSaveData()) return setStatus("fallback", "save-data");
    if (state) return;
    const run = () => {
      idleHandle = null;
      void initGl();
    };
    if ("requestIdleCallback" in window) {
      idleHandle = (
        window as Window & {
          requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number;
        }
      ).requestIdleCallback(run, { timeout: 3000 });
    } else {
      idleHandle = globalThis.setTimeout(run, 1500) as unknown as number;
    }
  };

  ScrollTrigger.addEventListener("refresh", onRefresh);
  mqReduce.addEventListener("change", onReduceChange);
  start();

  return {
    destroy() {
      destroyed = true;
      generation++;
      if (idleHandle !== null) {
        if ("cancelIdleCallback" in window) {
          (
            window as Window & { cancelIdleCallback: (h: number) => void }
          ).cancelIdleCallback(idleHandle);
        }
        globalThis.clearTimeout(idleHandle);
      }
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      mqReduce.removeEventListener("change", onReduceChange);
      disposeGl(true);
      setHeroGlStatus("pending");
    },
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function HeroGlTransition() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = createController(host);
    return () => controller.destroy();
  }, []);

  // Zero-size host; the canvas is appended imperatively (fixed, outside any
  // transformed ancestor) so strict-mode remounts get a fresh context.
  return <div ref={hostRef} aria-hidden="true" data-hero-gl-host="" />;
}
