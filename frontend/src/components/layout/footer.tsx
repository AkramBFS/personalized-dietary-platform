"use client";
import Link from "next/link";
import { Logo } from "./logo";

const footerLinks = {
  solutions: [
    { title: "Personal Dietitian", href: "#" },
    { title: "Calorie Tracker", href: "#" },
    { title: "Meal Plans", href: "#" },
    { title: "API Access", href: "#" },
  ],
  resources: [
    { title: "Blog", href: "#" },
    { title: "Nutrition Guides", href: "#" },
    { title: "Community", href: "#" },
    { title: "Help Center", href: "#" },
  ],
  company: [
    { title: "About Us", href: "#" },
    { title: "Careers", href: "#" },
    { title: "Privacy Policy", href: "#" },
    { title: "Terms of Service", href: "#" },
  ],
};

export default function FooterSection() {
  return (
    <footer className="bg-gradient-to-br from-[#052023] via-[#01181D] to-[#052025] dark:bg-foreground pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* --- Main Footer Content --- */}
        <div className="grid grid-cols-1 gap-12 mb-16 md:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <Link href="/" className="flex items-center space-x-3">
                <Logo forceDark />
              </Link>
            </div>
            <p className="max-w-sm text-teal-50 dark:text-gray-400">
              Your AI-powered personal dietitian and calorie counter. We make
              healthy eating simple and personalized.
            </p>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-teal-50 dark:text-white">
              Solutions
            </h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-teal-50 transition-colors hover:text-emerald-500 dark:text-gray-400"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-teal-50 dark:text-white">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-teal-50 transition-colors hover:text-emerald-500 dark:text-gray-400"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-teal-50 dark:text-white">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-teal-50 transition-colors hover:text-emerald-500 dark:text-gray-400"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Healthy / Newsletter */}
          <div className="lg:pl-4">
            <h3 className="mb-4 text-lg font-semibold text-teal-50 dark:text-white">
              Stay Healthy
            </h3>
            <p className="mb-4 text-sm text-teal-50 dark:text-gray-400">
              Get weekly tips and meal ideas.
            </p>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Email address @"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-teal-50 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-teal-800 dark:border-gray-800 pt-8 md:flex-row">
          <p className="text-sm text-teal-50 dark:text-gray-400">
            © {new Date().getFullYear()} SVMB. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-teal-50 hover:text-emerald-500 transition-colors"
            >
              <span className="sr-only">Twitter</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
              </svg>
            </Link>
            <Link
              href="#"
              className="text-teal-50 hover:text-emerald-500 transition-colors"
            >
              <span className="sr-only">Instagram</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <Link
              href="#"
              className="text-teal-50 hover:text-emerald-500 transition-colors"
            >
              <span className="sr-only">Facebook</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  fillRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
