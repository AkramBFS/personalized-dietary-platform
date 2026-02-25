"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
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
      <nav
        className={cn(
          "fixed z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border/40 py-3"
            : "bg-transparent py-5",
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* LOGO & BRAND */}
            <div className="flex lg:flex-1">
              <Link href="/" className="flex items-center space-x-3 group">
                <Logo />
                <span
                  className={cn(
                    "text-2xl font-bold tracking-tight transition-colors duration-300",
                    isScrolled ? "text-primary" : "text-primary",
                  )}
                >
                  Dieton
                </span>
              </Link>
            </div>

            {/* MOBILE MENU BUTTON */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground"
              >
                <Bars3Icon className="size-7" aria-hidden="true" />
              </button>
            </div>

            {/* DESKTOP NAV */}
            <PopoverGroup className="hidden lg:flex lg:gap-x-8">
              <Popover className="relative">
                <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-foreground outline-none hover:text-primary transition-colors group">
                  Services
                  <ChevronDownIcon
                    className="size-4 flex-none text-muted-foreground group-hover:text-primary transition-transform group-data-[open]:rotate-180"
                    aria-hidden="true"
                  />
                </PopoverButton>

                <PopoverPanel
                  transition
                  className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-popover/95 backdrop-blur-md border border-border-subtle shadow-2xl ring-1 ring-black/5 transition data-[closed]:translate-y-2 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150"
                >
                  <div className="p-3">
                    {services.map((item) => (
                      <div
                        key={item.name}
                        className="group relative flex items-center gap-x-6 rounded-2xl p-4 text-sm leading-6 border border-transparent hover:border-primary/20 hover:bg-background hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-secondary group-hover:bg-primary transition-colors">
                          <item.icon
                            className="size-6 text-secondary-foreground group-hover:text-primary-foreground"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-auto">
                          <Link
                            href={item.href}
                            className="block font-semibold text-foreground group-hover:text-primary transition-colors"
                          >
                            {item.name}
                            <span className="absolute inset-0" />
                          </Link>
                          <p className="mt-1 text-muted-foreground leading-5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Optional Footer section to make the panel feel "pro" */}
                  <div className="bg-muted/30 p-4 border-t border-border-subtle">
                    <a
                      href="#"
                      className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    >
                      View all services →
                    </a>
                  </div>
                </PopoverPanel>
              </Popover>

              {mainNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </PopoverGroup>

            {/* RIGHT SIDE ACTIONS */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
              {!isScrolled ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </>
              ) : (
                <Button
                  className="animate-in fade-in zoom-in duration-300"
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background p-6 sm:max-w-sm sm:ring-1 sm:ring-border">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <Logo />
              <span className="text-xl font-bold">Dieton</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-foreground"
            >
              <XMarkIcon className="size-7" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-border">
              <div className="space-y-2 py-6">
                <Disclosure as="div" className="-mx-3">
                  <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 hover:bg-muted">
                    Services
                    <ChevronDownIcon
                      className="size-5 flex-none group-data-[open]:rotate-180"
                      aria-hidden="true"
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 space-y-2">
                    {services.map((item) => (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={item.href}
                        className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-foreground hover:bg-muted"
                      >
                        {item.name}
                      </DisclosureButton>
                    ))}
                  </DisclosurePanel>
                </Disclosure>
                {mainNav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6 flex flex-col gap-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
};
