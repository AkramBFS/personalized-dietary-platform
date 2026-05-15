"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfileDropdown } from "@/components/dashboard/shared/UserProfileDropdown";
import { getProfileIdentity, CurrentProfileIdentity } from "@/lib/profile";
import { clearAuthSession } from "@/lib/auth";
import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Dialog,
  DialogPanel,
  Disclosure,
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
    href: "/services#ai-calorie-estimation",
    icon: CalculatorIcon,
  },
  {
    name: "Online Consultation",
    description: "Connect with certified nutritionists from anywhere.",
    href: "/services#online-consultation",
    icon: UserGroupIcon,
  },
  {
    name: "Personalized Plans",
    description: "Custom meal and nutrition plans tailored to your goals.",
    href: "/services#personalized-plans",
    icon: SparklesIcon,
  },
  {
    name: "Seasonal Programs",
    description: "Specialized guides for Ramadan and Summer.",
    href: "/services#seasonal-programs",
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
  const [profileIdentity, setProfileIdentity] = useState<CurrentProfileIdentity | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadIdentity = async () => {
      const identity = await getProfileIdentity();
      if (isMounted) setProfileIdentity(identity);
    };

    void loadIdentity();

    return () => {
      isMounted = false;
    };
  }, []);

  useGSAP(() => {
    // Ensure the AI section exists before creating the trigger
    const aiSection = document.querySelector("#ai-scan-section");
    if (!aiSection) return;

    ScrollTrigger.create({
      trigger: "#ai-scan-section",
      start: "top top",
      // Calculate the end point to match the 3000px scrub distance + 100vh for the initial zoom phase.
      end: () => `+=${3000 + window.innerHeight}`,
      onEnter: () => gsap.to(headerRef.current, { yPercent: -100, autoAlpha: 0, duration: 0.4, ease: "power2.out" }),
      onLeave: () => gsap.to(headerRef.current, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" }),
      onEnterBack: () => gsap.to(headerRef.current, { yPercent: -100, autoAlpha: 0, duration: 0.4, ease: "power2.out" }),
      onLeaveBack: () => gsap.to(headerRef.current, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" }),
      // Invalidate on refresh to ensure window.innerHeight is recalculated if the user resizes
      invalidateOnRefresh: true,
    });
  }, { scope: headerRef });

  return (
    <header ref={headerRef} className="fixed top-0 left-0 w-full z-50 transition-colors duration-300 pointer-events-none">
      {/* OUTER NAV (CENTERING CONTAINER) */}
      <nav className="w-full flex justify-center pointer-events-none">
        {/* ANIMATED NAVBAR SHELL */}
        <div
          className={cn(
            "pointer-events-auto transition-all duration-500 ease-in-out",
            "backdrop-blur-md",
            "flex items-center",
            isScrolled
              ? "w-full lg:w-[75vw] rounded-none lg:rounded-full px-6 py-2 shadow-xl bg-white/80 dark:bg-white/10 border border-border/30 dark:border-transparent"
              : "w-full rounded-none px-6 py-3 border border-transparent bg-transparent",
          )}
        >
          {/* CONTENT WRAPPER */}
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex items-center justify-between">
              {/* LOGO */}
              <div className="flex lg:flex-1">
                <Link href="/" className="flex items-center space-x-3">
                  <Logo />
                </Link>
              </div>

              {/* MOBILE MENU BUTTON */}
              <div className="flex lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className=" -m-2.5 inline-flex items-center justify-center
    rounded-md p-2.5
    text-foreground dark:text-white
    hover:text-emerald-500 dark:hover:text-emerald-300
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
    text-foreground dark:text-white hover:text-emerald-500 dark:hover:text-emerald-300
    transition-colors
    outline-none focus:outline-none focus:ring-0
  "
                  >
                    Services
                    <ChevronDownIcon className="size-4 transition-transform group-data-[open]:rotate-180" />
                  </PopoverButton>

                  <PopoverPanel
                    transition
                    className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md rounded-3xl bg-popover/90 backdrop-blur-md border border-border-subtle shadow-2xl transition"
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
                    className="text-sm font-medium uppercase tracking-[0.025em] text-foreground dark:text-white hover:text-emerald-500 dark:hover:text-emerald-300"
                  >
                    {item.name}
                  </Link>
                ))}
              </PopoverGroup>

              {/* RIGHT SIDE ACTIONS */}
              <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
                {/* THEME TOGGLE */}
                <ThemeToggle />

                {profileIdentity ? (
                  <UserProfileDropdown
                    user={{
                      username: profileIdentity.username,
                      email: profileIdentity.email,
                      avatarUrl: profileIdentity.avatarUrl,
                    }}
                    role={profileIdentity.role}
                  />
                ) : !isScrolled ? (
                  <>
                    <Button
                      key="login-btn"
                      variant="ghost"
                      className="animate-in fade-in zoom-in duration-300"
                      asChild
                    >
                      <Link
                        href="/login"
                        className="text-primary dark:text-white hover:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        Login
                      </Link>
                    </Button>
                    <Button
                      key="signup-btn"
                      asChild
                      className="animate-in fade-in zoom-in duration-300 shadow-sm"
                    >
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    key="get-started-btn"
                    className="animate-in fade-in zoom-in duration-300 animate-delay-100"
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

      {/* MOBILE DRAWER */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background/95 backdrop-blur-md px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-border/10 shadow-2xl">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="-m-1.5 p-1.5">
              <Logo />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-foreground hover:text-emerald-500 transition-colors"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="size-7" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-8 flow-root">
            <div className="-my-6 divide-y divide-border/20">
              <div className="space-y-2 py-6">
                {/* Services with Disclosure for Mobile */}
                <Disclosure as="div" className="-mx-3">
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-foreground hover:bg-secondary/50 transition-colors">
                        Services
                        <ChevronDownIcon
                          className={cn(
                            "size-5 flex-none transition-transform duration-200",
                            open ? "rotate-180" : ""
                          )}
                          aria-hidden="true"
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="mt-2 space-y-2">
                        {services.map((item) => (
                          <Disclosure.Button
                            key={item.name}
                            as={Link}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-foreground/80 hover:bg-secondary/30 hover:text-emerald-500 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="size-5 text-emerald-500/70" />
                              {item.name}
                            </div>
                          </Disclosure.Button>
                        ))}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>

                {mainNav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-secondary/50 hover:text-emerald-500 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="py-6">
                {profileIdentity ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                      Account
                    </p>
                    <div className="flex items-center gap-4 px-1 pb-4">
                      <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                         <span className="text-emerald-500 font-bold text-lg">
                           {(profileIdentity.username || "U").charAt(0).toUpperCase()}
                         </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground leading-tight">{profileIdentity.username}</span>
                        <span className="text-xs text-muted-foreground">{profileIdentity.email}</span>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Link
                        href={`/${profileIdentity.role}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-foreground hover:bg-secondary/50 transition-all"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          clearAuthSession();
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-destructive hover:bg-destructive/10 transition-all"
                      >
                        Log out
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-foreground hover:bg-secondary/50 transition-all"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl bg-primary px-3 py-3 text-center text-base font-semibold leading-7 text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
};
