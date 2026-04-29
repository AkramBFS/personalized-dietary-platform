import "./globals.css";
import { Syne, Space_Grotesk } from "next/font/google";
import { bootstrapLookups } from "@/lib/lookups";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata = {
  title: "Dieton",
  description:
    "A web application for managing and tracking your fitness goals and calorie intake.",
};

import { ThemeProvider } from "@/components/theme-provider";

// Bootstrap lookup data on server startup
bootstrapLookups().catch((err) =>
  console.error("Failed to bootstrap lookups:", err),
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full ${syne.variable} ${spaceGrotesk.variable}`}
    >
      <body className="h-full flex flex-col">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          themes={['light', 'dark', 'special']}
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex-grow">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
