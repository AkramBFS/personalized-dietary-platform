import Image from "next/image";
import { cn } from "@/lib/utils";

export const Logo = ({
  className,
  forceLight,
  forceDark,
}: {
  className?: string;
  forceLight?: boolean;
  forceDark?: boolean;
}) => {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src="/branding/logo2.svg"
        alt="App Logo"
        width={120}
        height={32}
        priority
        className={cn(
          "h-5 w-auto",
          forceLight ? "block" : forceDark ? "hidden" : "block dark:hidden",
        )}
      />
      <Image
        src="/branding/logo.svg"
        alt="App Logo Dark"
        width={120}
        height={32}
        priority
        className={cn(
          "h-5 w-auto",
          forceDark ? "block" : forceLight ? "hidden" : "hidden dark:block",
        )}
      />
    </div>
  );
};

export const LogoIcon = ({
  className,
  uniColor,
}: {
  className?: string;
  uniColor?: boolean;
}) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5 text-foreground", className)}
    >
      {/* Translating down by 0.5 centers the 23-unit-tall shape perfectly in the 24-unit canvas */}
      <g transform="translate(0, 0.5)">
        <path
          d="
        M 20 2 
        L 8 2 
        A 7 7 0 0 0 8 16 
        L 12 16 
        A 2 2 0 0 0 12 12 
        L 8 12 
        A 3 3 0 0 1 8 6 
        L 20 6 
        A 2 2 0 0 0 20 2 
        Z 
        
        M 4 21 
        L 16 21 
        A 7 7 0 0 0 16 7 
        L 12 7 
        A 2 2 0 0 0 12 11 
        L 16 11 
        A 3 3 0 0 1 16 17 
        L 4 17 
        A 2 2 0 0 0 4 21 
        Z
      "
          fill={uniColor ? "currentColor" : "url(#logo-gradient)"}
        />
      </g>
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="12"
          y1="0"
          x2="12"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0e9859" />
          <stop offset="1" stopColor="#75a266" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const LogoStroke = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn("size-7 w-7 text-foreground", className)}
      viewBox="0 0 71 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M61.25 1.625L70.75 1.5625C70.75 4.77083 70.25 7.79167 69.25 10.625C68.2917 13.4583 66.8958 15.9583 65.0625 18.125C63.2708 20.25 61.125 21.9375 58.625 23.1875C56.1667 24.3958 53.4583 25 50.5 25C46.875 25 43.6667 24.2708 40.875 22.8125C38.125 21.3542 35.125 19.2083 31.875 16.375C29.75 14.4167 27.7917 12.8958 26 11.8125C24.2083 10.7292 22.2708 10.1875 20.1875 10.1875C18.0625 10.1875 16.25 10.7083 14.75 11.75C13.25 12.75 12.0833 14.1875 11.25 16.0625C10.4583 17.9375 10.0625 20.1875 10.0625 22.8125L0 22.9375"
        stroke="currentColor"
        strokeWidth={0.5}
      />
    </svg>
  );
};
