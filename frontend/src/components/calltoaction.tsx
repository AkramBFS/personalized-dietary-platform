"use client";

export default function CallToAction() {
  return (
    <div className="w-full">
      <div className="group relative mb-20 w-11/12 md:w-4/5 mx-auto flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-500 to-emerald-400 p-10 text-center md:p-16 shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
        {/* background decorative circle svg */}
        <div className="pointer-events-none absolute -right-20 -top-10 size-64 transition-all duration-700 ease-in-out origin-top-right group-hover:-translate-x-6 group-hover:-translate-y-2 group-hover:scale-110 group-hover:-rotate-12 opacity-20">
          <svg
            className="size-full text-white"
            fill="currentColor"
            viewBox="0 0 200 200"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0ZM100 180C55.8172 180 20 144.183 20 100C20 55.8172 55.8172 20 100 20C144.183 20 180 55.8172 180 100C180 144.183 144.183 180 100 180Z"
            />
          </svg>
        </div>

        <h2 className="relative z-10 mb-6 text-3xl font-bold text-white md:text-5xl tracking-tight">
          Ready to start your journey?
        </h2>

        <p className="relative z-10 mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
          Join thousands of others achieving their health goals with Dieton's
          AI-powered dietitian.
        </p>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row">
          <button className="group/btn flex items-center justify-center rounded-full bg-white px-8 py-3 font-semibold text-emerald-600 transition-all hover:bg-gray-50 hover:shadow-lg active:scale-95">
            Get Started
            <svg
              className="ml-2 size-4 transition-transform duration-300 group-hover/btn:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>

          {/* Talk to Chatbot Button - Updated with Hover Reaction */}
          <button className="group/chat flex items-center justify-center rounded-full border-2 border-white bg-transparent px-8 py-3 font-semibold text-white transition-all duration-300 hover:bg-white hover:text-emerald-600 hover:shadow-lg active:scale-95">
            <svg
              className="mr-2 size-5 transition-transform duration-300 group-hover/chat:rotate-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 4.99 4.99 0 001.267-3.461C4.17 15.298 3 13.756 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            Talk to Chatbot
          </button>
        </div>
      </div>
    </div>
  );
}
