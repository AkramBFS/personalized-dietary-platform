"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const navLinks: NavItem[] = [
    {
      label: "Shop",
      children: [
        { label: "Our Plans", href: "/shop/plans" },
        { label: "Schedule consult", href: "/shop/schedule" },
      ],
    },
    {
      label: "Blog",
      children: [
        { label: "Recent Posts", href: "/blog" },
        { label: "Write Your Own", href: "/blog/write" },
      ],
    },
    {
      label: "AI Features",
      children: [
        { label: "Chatbot Helper", href: "/ai/chatbot" },
        { label: "Calorie Estimate", href: "/ai/calories" },
      ],
    },
    { label: "About", href: "/about" },
  ];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      ref={navRef}
      className="bg-white border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* --- Left: Logo --- */}
          <Link
            href="/"
            className="flex items-center gap-3 flex-shrink-0 group"
          >
            <Image
              src="/logo.png"
              alt="REgimo Logo"
              width={48} // Desired width in pixels
              height={48} // Desired height in pixels
              style={{ height: "auto", width: "36px" }} // Maintains aspect ratio
              className="object-contain transition-transform group-hover:scale-105"
              priority
            />
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              REgimo
            </span>
          </Link>

          {/* --- Desktop Menu (Hidden on Mobile) --- */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                {link.children ? (
                  <>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === link.label ? null : link.label,
                        )
                      }
                      className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1"
                    >
                      {link.label} <span>▾</span>
                    </button>
                    {openDropdown === link.label && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-md py-2 transition-all">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href!}
                    className="text-gray-600 hover:text-blue-600 font-medium"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* --- Mobile Hamburger Button --- */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu Dropdown (Vertical) --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 pb-4 shadow-lg">
          {navLinks.map((link) => (
            <div key={link.label} className="px-4 py-2">
              {link.children ? (
                <>
                  <div className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-2 mt-2">
                    {link.label}
                  </div>
                  <div className="flex flex-col gap-2 pl-2">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-gray-700 py-1 hover:text-blue-600"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={link.href!}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 font-medium text-gray-700 hover:text-blue-600"
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
