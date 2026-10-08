"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={isLanding ? "special" : undefined}
    >
      {children}
    </NextThemesProvider>
  );
}
