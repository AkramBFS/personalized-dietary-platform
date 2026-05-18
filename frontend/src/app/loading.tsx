import { Logo, LogoIcon } from "@/components/layout/logo"; // Adjust import path as needed

export default function Loading() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* --- Ambient Background Glow --- */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px] animate-pulse duration-[4000ms]" />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-10">
        {/* --- Elaborate Orbital Spinner --- */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Outer Ring - Spins Clockwise */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-b-primary opacity-80 animate-spin [animation-duration:3s]" />

          {/* Middle Ring - Spins Counter-Clockwise */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-l-muted-foreground/40 border-r-muted-foreground/40 animate-spin [animation-direction:reverse] [animation-duration:2s]" />

          {/* Inner Accent Ring - Fast Pulse */}
          <div className="absolute inset-6 rounded-full border border-primary/50 bg-primary/5 blur-[2px] animate-pulse [animation-duration:1s]" />

          {/* Core - Logo Icon */}
          <div className="relative flex items-center justify-center animate-pulse [animation-duration:2s]">
            <LogoIcon className="h-10 w-10 drop-shadow-[0_0_15px_rgba(61,220,151,0.5)]" />
          </div>
        </div>

        {/* --- Branding & Typography --- */}
        <div className="flex flex-col items-center gap-4">
          {/* Full Logo Fade-in */}
          <div className="opacity-0 animate-[fadeIn_1s_ease-in-out_forwards]">
            <Logo className="h-6" />
          </div>

          {/* Status Text */}
          <div className="flex items-center gap-3 opacity-0 animate-[fadeIn_1s_ease-in-out_0.5s_forwards]">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </div>
            <span className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              Initializing Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Optional: Add custom keyframes inline if they aren't in your tw-animate-css */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />
    </div>
  );
}
