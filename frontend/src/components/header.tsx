"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  CalculatorIcon,
  UserGroupIcon,
  SparklesIcon,
  CalendarIcon,
  BookOpenIcon,
  UsersIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const services = [
  {
    name: "AI Calorie Estimation",
    description: "Get instant nutritional insights from your food photos.",
    href: "/services/ai-calorie",
    icon: CalculatorIcon,
  },
  {
    name: "Online Consultation",
    description: "Connect with certified nutritionists from anywhere.",
    href: "/services/consultation",
    icon: UserGroupIcon,
  },
  {
    name: "Personalized Plans",
    description: "Custom meal and workout plans tailored to your goals.",
    href: "/services/plans",
    icon: SparklesIcon,
  },
  {
    name: "Seasonal Programs",
    description: "Specialized guides for Ramadan and Summer fitness.",
    href: "/services/seasonal",
    icon: CalendarIcon,
  },
];

const mainNav = [
  { name: "Blog", href: "/blog", icon: BookOpenIcon },
  { name: "Community", href: "/community", icon: UsersIcon },
  { name: "About", href: "/about", icon: InformationCircleIcon },
];

export const HeroHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      {/* OUTER NAV (CENTERING CONTAINER) */}
      <nav className="fixed z-50 w-full flex justify-center pointer-events-none">
        {/* ANIMATED NAVBAR SHELL */}
        <div
          className={cn(
            "pointer-events-auto transition-all duration-500 ease-in-out",
            "bg-foreground/0 backdrop-blur-md ",
            "flex items-center",
            isScrolled
              ? "w-full lg:w-[50vw] rounded-none lg:rounded-full px-6 py-2 shadow-xl bg-white/10"
              : "w-full rounded-none px-6 py-3 ",
          )}
        >
          {/* CONTENT WRAPPER */}
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex items-center justify-between">
              {/* LOGO */}
              <div className="flex lg:flex-1">
                <Link href="/" className="flex items-center space-x-3">
                  <Logo forceDark />
                </Link>
              </div>

              {/* MOBILE MENU BUTTON */}
              <div className="flex lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className=" -m-2.5 inline-flex items-center justify-center
    rounded-md p-2.5
    text-white
    hover:text-emerald-300
    focus:outline-none"
                >
                  <Bars3Icon className="size-7" />
                </button>
              </div>

              {/* DESKTOP NAV */}
              <PopoverGroup className="hidden lg:flex lg:gap-x-8 lg:items-center">
                <Popover className="relative">
                  <PopoverButton
                    className="
    flex items-center gap-x-1
    text-sm font-medium uppercase tracking-[0.025em]
    text-white hover:text-emerald-300
    transition-colors
    outline-none focus:outline-none focus:ring-0
  "
                  >
                    Services
                    <ChevronDownIcon className="size-4 transition-transform group-data-[open]:rotate-180" />
                  </PopoverButton>

                  <PopoverPanel
                    transition
                    className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md rounded-3xl bg-popover/80 backdrop-blur-md border border-border-subtle shadow-2xl transition"
                  >
                    <div className="p-3">
                      {services.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-x-6 rounded-2xl p-4 hover:bg-background transition"
                        >
                          <div className="flex size-11 items-center justify-center rounded-lg bg-secondary">
                            <item.icon className="size-6" />
                          </div>
                          <div>
                            <Link href={item.href} className="font-semibold">
                              {item.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverPanel>
                </Popover>

                {mainNav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-sm font-medium uppercase tracking-[0.025em] text-white hover:text-emerald-300"
                  >
                    {item.name}
                  </Link>
                ))}
              </PopoverGroup>

              {/* RIGHT SIDE ACTIONS */}
              <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center gap-x-4">
                {!isScrolled ? (
                  <>
                    <Button className="text-background bg-foreground/0" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    className="transition-transform duration-300 scale-105"
                    asChild
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER (UNCHANGED) */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full bg-background p-6 sm:max-w-sm">
          <div className="flex items-center justify-between">
            <Logo />
            <button onClick={() => setMobileMenuOpen(false)}>
              <XMarkIcon className="size-7" />
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
};
