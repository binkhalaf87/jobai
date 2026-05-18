# Frontend

This package is the Next.js 14 frontend for the resume analysis platform.

## Goals

- Provide a clean base for a production web app
- Keep App Router structure easy to extend
- Centralize shared UI styling and configuration

## Planned areas

- `app/` - Route segments, layouts, and pages
- `components/` - Shared UI building blocks
- `lib/` - Frontend-only helpers, clients, and utilities
- `public/` - Static assets

## Suggested next steps

1. Install dependencies with your preferred package manager.
2. Add environment handling for backend API URLs.
3. Introduce feature folders only when product flows become clear.

## Environment variables

Copy `.env.example` to `.env.local` for local development.

- `NEXT_PUBLIC_API_URL` - Public URL of the backend API, including the API prefix
- `BACKEND_URL` - Server-side backend origin used by the Vercel rewrite, without the API prefix
- `NEXT_PUBLIC_USE_EXTERNAL_API_URL` - Optional. Set to `true` only when production browser requests should call `NEXT_PUBLIC_API_URL` directly.

The shared helper at `lib/config.ts` falls back to `http://localhost:8000/api/v1` during local development. In production it uses `/api/v1` by default so requests stay on the same Vercel origin and are proxied to `BACKEND_URL` by `next.config.mjs`.

## Vercel deployment

- Set the project root directory to `frontend/`
- Keep the default Next.js build and output settings
- Configure `BACKEND_URL` in the Vercel project environment settings, for example `https://your-api.up.railway.app`
- Remove stale `NEXT_PUBLIC_API_URL` values from production unless direct browser-to-backend calls are intentionally enabled with `NEXT_PUBLIC_USE_EXTERNAL_API_URL=true`

The included `vercel.json` only declares the framework and does not add custom routing or runtime behavior.
