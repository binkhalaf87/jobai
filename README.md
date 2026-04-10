# JobAI Monorepo

This repository contains the starter structure for a Jobscan-like resume analysis platform.

## Structure

- `frontend/` - Next.js 14 web application for the user-facing product
- `backend/` - FastAPI service for analysis APIs and internal application logic
- `docs/` - Architecture notes and local setup guidance

## Design goals

- Keep the monorepo easy to grow as product areas expand
- Separate frontend and backend concerns cleanly
- Start with minimal dependencies and clear ownership boundaries
- Document the intended architecture before adding business logic

## Getting started

Each directory has its own `README.md` with local details.

- Frontend notes: `frontend/README.md`
- Backend notes: `backend/README.md`
- System notes: `docs/README.md`

## Environment variables

Environment templates are provided for each deployable app.

- `frontend/.env.example`
- `backend/.env.example`

### Frontend

- `NEXT_PUBLIC_API_URL` - Public base URL for the FastAPI API, including the versioned prefix. Example: `https://api.example.com/api/v1`

### Backend

- `APP_NAME` - Display name used in API metadata
- `APP_VERSION` - Version string exposed in API metadata
- `API_PREFIX` - Versioned API base path, such as `/api/v1`
- `ENVIRONMENT` - Runtime environment name, such as `development` or `production`
- `DEBUG` - Enables FastAPI debug mode when set to `true`
- `DATABASE_URL` - Primary database connection string
- `OPENAI_API_KEY` - Optional OpenAI credential for rewrite generation features
- `JWT_SECRET` - Secret used for future authentication tokens
- `ALLOWED_ORIGIN` - Frontend origin allowed to access the backend
- `REDIS_URL` - Optional Redis connection string for future cache or task infrastructure
- `STRIPE_SECRET_KEY` - Optional Stripe secret key reserved for future billing features
- `PORT` - Runtime port used by the server process; usually injected by the hosting platform

## Deployment notes

- The frontend is prepared for Vercel deployment from the `frontend/` directory.
- The backend includes a `Dockerfile` and `railway.toml` for Railway deployment.
- The repository root also includes a Railway-ready `Dockerfile` and `railway.toml` so the backend can deploy directly from the monorepo root without extra monorepo build configuration.
- The backend bootstrap now runs through `python serve.py`, which applies Alembic migrations before serving and falls back to a CORS-enabled 503 app if startup fails.
