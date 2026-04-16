This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```
frontend
├─ components.json
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ branding
│  │  ├─ bg-1.jpg
│  │  ├─ bg-10.jpg
│  │  ├─ bg-2.jpg
│  │  ├─ bg-3.jpg
│  │  ├─ bg-4.jpg
│  │  ├─ bg-5.jpg
│  │  ├─ bg-6.jpg
│  │  ├─ bg-7.jpg
│  │  ├─ bg-8.jpg
│  │  ├─ bg-9.jpg
│  │  ├─ Burger_ingredients_floating_202604070417.jpeg
│  │  ├─ chevron-down-outline.svg
│  │  ├─ Expert-call.jpg
│  │  ├─ Expert-call2.jpg
│  │  ├─ hero-bg.jpg
│  │  ├─ HeroVideo.mp4
│  │  ├─ login-bg.jpg
│  │  ├─ login-div.jpg
│  │  ├─ logo.svg
│  │  └─ screen.jpg
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ professionals
│  │  ├─ mj.jpg
│  │  ├─ mj2.jpg
│  │  ├─ mj3.jpg
│  │  ├─ mj4.jpg
│  │  ├─ pf1.jpg
│  │  ├─ pf2.jpg
│  │  └─ pf3.jpg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ src
│  ├─ app
│  │  ├─ actions
│  │  │  ├─ register.ts
│  │  │  └─ submitRegistration.ts
│  │  ├─ admin
│  │  │  └─ page.tsx
│  │  ├─ dashboard
│  │  │  ├─ data.json
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ not-found.tsx
│  │  ├─ page.tsx
│  │  └─ register
│  │     └─ page.tsx
│  ├─ components
│  │  ├─ ai
│  │  │  └─ aidetection.tsx
│  │  ├─ animations
│  │  │  ├─ dragarrow.tsx
│  │  │  └─ FadeIn.tsx
│  │  ├─ app-sidebar.tsx
│  │  ├─ auth
│  │  │  ├─ login.tsx
│  │  │  └─ Registration-Flow.tsx
│  │  ├─ calltoaction.tsx
│  │  ├─ chart-area-interactive.tsx
│  │  ├─ content.tsx
│  │  ├─ dashboard
│  │  │  └─ dashboard.tsx
│  │  ├─ faqs.tsx
│  │  ├─ features.tsx
│  │  ├─ forms
│  │  │  ├─ LoginForm.tsx
│  │  │  ├─ StepActivity.tsx
│  │  │  ├─ StepAgeWeight.tsx
│  │  │  ├─ StepBMI.tsx
│  │  │  ├─ StepCountrySelect.tsx
│  │  │  ├─ StepDiet.tsx
│  │  │  ├─ StepGoal.tsx
│  │  │  ├─ StepHeight.tsx
│  │  │  ├─ StepMedicalHistory.tsx
│  │  │  ├─ StepReview.tsx
│  │  │  └─ StepSignUp.tsx
│  │  ├─ header.tsx
│  │  ├─ hero-section.tsx
│  │  ├─ layout
│  │  │  ├─ footer.tsx
│  │  │  ├─ logo.tsx
│  │  │  └─ navbar.tsx
│  │  ├─ nav-documents.tsx
│  │  ├─ nav-main.tsx
│  │  ├─ nav-secondary.tsx
│  │  ├─ nav-user.tsx
│  │  ├─ shared
│  │  │  └─ stats.tsx
│  │  ├─ testimonials.tsx
│  │  └─ ui
│  │     ├─ accordion.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ breadcrumb.tsx
│  │     ├─ Button.tsx
│  │     ├─ Card.tsx
│  │     ├─ chart.tsx
│  │     ├─ checkbox.tsx
│  │     ├─ drawer.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ Input.tsx
│  │     ├─ label.tsx
│  │     ├─ ProgressBar.tsx
│  │     ├─ select.tsx
│  │     ├─ separator.tsx
│  │     ├─ sheet.tsx
│  │     ├─ sidebar.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ sonner.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     ├─ toggle-group.tsx
│  │     ├─ toggle.tsx
│  │     └─ tooltip.tsx
│  ├─ context
│  ├─ features
│  ├─ hooks
│  │  └─ use-mobile.ts
│  ├─ lib
│  │  ├─ api.ts
│  │  ├─ auth.ts
│  │  ├─ constants.ts
│  │  ├─ utils.ts
│  │  └─ validators.ts
│  └─ types
└─ tsconfig.json

```