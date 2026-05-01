"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Palette } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder of the same size to prevent layout shift / hydration mismatch
    return <div className="w-9 h-9 rounded-md bg-muted animate-pulse" />;
  }

  // Function to cycle to the next theme
  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("special");
    else setTheme("light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      aria-label={`Current theme: ${theme}. Click to change theme.`}
    >
      {resolvedTheme === "light" && <Sun className="h-5 w-5 text-foreground" />}
      {resolvedTheme === "dark" && <Moon className="h-5 w-5 text-foreground" />}
      {resolvedTheme === "special" && <Palette className="h-5 w-5 text-foreground" />}
    </button>
  );
}
