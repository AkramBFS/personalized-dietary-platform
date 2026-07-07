import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { cn } from "~/lib/utils";

export type ShimmerProps = ComponentPropsWithoutRef<"span"> & {
  children: ReactNode;
  duration?: number;
};

export function Shimmer({
  children,
  className,
  duration = 1.2,
  style,
  ...props
}: ShimmerProps) {
  const shimmerStyle: CSSProperties = {
    ...style,
    backgroundImage:
      "linear-gradient(110deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)) 25%, hsl(var(--muted-foreground)) 50%, hsl(var(--foreground)) 75%, hsl(var(--foreground)) 100%)",
    backgroundSize: "200% 100%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    animation: `shimmer ${duration}s linear infinite`,
  };

  return (
    <>
      <span
        className={cn("inline-block", className)}
        style={shimmerStyle}
        {...props}
      >
        {children}
      </span>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
}
