"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Shop",
    children: [
      { name: "Our Plans", href: "/shop/plans" },
      { name: "Schedule consult", href: "/shop/schedule" },
    ],
  },
  {
    name: "Blog",
    children: [
      { name: "Recent Posts", href: "/blog" },
      { name: "Write Your Own", href: "/blog/write" },
    ],
  },
  {
    name: "AI Features",
    children: [
      { name: "Chatbot Helper", href: "/ai/chatbot" },
      { name: "Calorie Estimate", href: "/ai/calories" },
    ],
  },
  { name: "About", href: "/about" },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <Disclosure
      as="nav"
      className="sticky top-0 z-50 bg-gray-900 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button*/}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon
                aria-hidden="true"
                className="block size-6 group-data-[open]:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden size-6 group-data-[open]:block"
              />
            </DisclosureButton>
          </div>

          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image
                alt="Dieton Logo"
                src="/branding/logo.svg"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-white font-bold text-xl hidden md:block">
                REgimo
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) =>
                  item.children ? (
                    <Menu as="div" key={item.name} className="relative">
                      <MenuButton className="flex items-center gap-x-1 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                        {item.name}
                        <ChevronDownIcon
                          className="size-4 text-gray-400"
                          aria-hidden="true"
                        />
                      </MenuButton>
                      <MenuItems
                        transition
                        className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                      >
                        {item.children.map((child) => (
                          <MenuItem key={child.href}>
                            <Link
                              href={child.href}
                              className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"
                            >
                              {child.name}
                            </Link>
                          </MenuItem>
                        ))}
                      </MenuItems>
                    </Menu>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href || "#"}
                      className={classNames(
                        pathname === item.href
                          ? "bg-gray-950 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "rounded-md px-3 py-2 text-sm font-medium",
                      )}
                    >
                      {item.name}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Right side: Notifications & Profile */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button
              type="button"
              className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-3">
              <MenuButton className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white">
                <Image
                  alt="User profile"
                  src="/professionals/pf1.jpg"
                  width={32}
                  height={32}
                  className="size-8 rounded-full"
                />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
              >
                <MenuItem>
                  <Link
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"
                  >
                    Your Profile
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"
                  >
                    Settings
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"
                  >
                    Sign out
                  </Link>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.name}
                  </div>
                  {item.children.map((child) => (
                    <DisclosureButton
                      key={child.href}
                      as={Link}
                      href={child.href}
                      className="block rounded-md px-3 py-2 pl-6 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {child.name}
                    </DisclosureButton>
                  ))}
                </>
              ) : (
                <DisclosureButton
                  as={Link}
                  href={item.href || "#"}
                  className={classNames(
                    pathname === item.href
                      ? "bg-gray-950 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium",
                  )}
                >
                  {item.name}
                </DisclosureButton>
              )}
            </div>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
