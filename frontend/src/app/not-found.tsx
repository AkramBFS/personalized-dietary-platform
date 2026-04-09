import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-full place-items-center bg-gradient-to-br from-emerald-400 to-teal-500 px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-white">404</p>

        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
          Page not found
        </h1>

        <p className="mt-6 text-lg font-medium text-white sm:text-xl">
          Sorry, we couldn’t find the page you’re looking for.
        </p>

        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/"
            className="rounded-md bg-emerald-400 px-3.5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Go back home
          </Link>

          <Link href="/contact" className="text-sm font-semibold text-white">
            Contact support <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
