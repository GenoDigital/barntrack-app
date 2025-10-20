# Barntrack - Feed Cost Management

This is the public frontend repository for Barntrack, an agricultural feed management platform that tracks feed consumption, costs, and suppliers across multiple farms.

## Tech Stack

- **Next.js 15** with App Router and React 19
- **Supabase** for backend (PostgreSQL, Auth, Real-time)
- **Stripe** for subscription billing
- **TailwindCSS v4** with shadcn/ui components
- **TypeScript** with strict mode
- **Zustand** for state management

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Required environment variables for deployment:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Deployment

This application is deployed on Vercel.

## Note

This repository contains only the frontend application. Backend services (Supabase Edge Functions, database migrations) are managed in a separate private repository.

## Auto-Sync

This repository is automatically synced from a private repository. Changes should be made in the private repo, not directly here.
