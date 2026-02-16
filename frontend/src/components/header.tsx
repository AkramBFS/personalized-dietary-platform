"use client";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import React from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Features", href: "#link" },
  { name: "Plans", href: "#link" },
  { name: "About", href: "#link" },
];

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className={cn(
          "fixed z-20 w-full transition-all duration-300",
          isScrolled &&
            "bg-secondary text-secondary-foreground border-b border-border backdrop-blur-lg",
        )}
      >
        {/* ⬇️ more horizontal breathing room */}
        <div className="mx-auto max-w-6xl px-8 lg:px-12">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-4 lg:gap-0">
            {/* LEFT SIDE */}
            <div className="flex w-full justify-between gap-8 lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-3"
              >
                <Logo />
                <span
                  className={cn(
                    "text-2xl font-semibold tracking-tight transition-colors duration-300",
                    isScrolled ? "text-secondary-foreground" : "text-primary",
                  )}
                >
                  Dieton
                </span>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-7 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-7 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>

              {/* DESKTOP MENU */}
              <div className="m-auto hidden size-fit lg:block">
                <ul className="flex gap-3">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Button asChild variant="ghost" size="lg">
                        <Link href={item.href} className="text-xl font-medium">
                          <span>{item.name}</span>
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT SIDE / MOBILE MENU */}
            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-xl font-medium">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex w-full flex-col space-y-4 sm:flex-row sm:gap-4 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="#">
                    <span>Login</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="#">
                    <span>Sign Up</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                >
                  <Link href="#">
                    <span>Get Started</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
