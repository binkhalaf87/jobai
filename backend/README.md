# Backend

This package is the FastAPI backend for the resume analysis platform.

## Goals

- Keep HTTP concerns separate from domain logic
- Make it easy to introduce versioned APIs later
- Leave clear extension points for configuration, services, and persistence

## Planned areas

- `app/api/` - API routers and request/response boundaries
- `app/core/` - Application configuration and shared backend concerns
- `app/services/` - Orchestration and business services
- `app/models/` - Domain and persistence models

## Suggested next steps

1. Create environment-specific settings in `app/core/config.py`.
2. Add API versioning once the first real endpoints are defined.
3. Keep business logic in services instead of route handlers.

## Environment variables

Copy `.env.example` to `.env` for local development.

- `APP_NAME` - Name exposed in FastAPI metadata
- `APP_VERSION` - Version exposed in FastAPI metadata
- `API_PREFIX` - Versioned API prefix, for example `/api/v1`
- `ENVIRONMENT` - Runtime environment label
- `DEBUG` - Enables FastAPI debug mode when set to `true`
- `DATABASE_URL` - Database connection string for the primary application datastore
- `OPENAI_API_KEY` - Optional until AI-powered rewrite generation is used
- `OPENAI_REWRITE_MODEL` - Optional model name override for rewrite suggestions, defaults to `gpt-5-mini`
- `JWT_SECRET` - Secret used for future token signing and verification
- `ALLOWED_ORIGIN` - Comma-separated frontend origins allowed to call the API. In production this should include your Vercel frontend URL.
- `REDIS_URL` - Optional Redis connection string for future caching, queues, or background coordination
- `STRIPE_SECRET_KEY` - Optional secret key reserved for future billing integration
- `PAYMOB_API_KEY` - Optional Paymob server-side API key used to create payment intentions
- `PAYMOB_HMAC_SECRET` - Optional Paymob webhook signature secret reserved for backend webhook validation
- `PAYMOB_PUBLIC_KEY` - Optional Paymob public key for future checkout bootstrap responses
- `PAYMOB_INTEGRATION_ID` - Optional Paymob integration identifier used when requesting payment intentions
- `PAYMOB_IFRAME_ID` - Optional Paymob iframe identifier if you later use the hosted iframe checkout flow
- `RESUME_STORAGE_DIR` - Optional durable filesystem path used for uploaded resume files. Defaults to `backend/storage/resumes`
- `PORT` - Port used by Uvicorn locally or by the hosting platform

The backend settings loader validates the core runtime variables together and raises a clear startup error if any are missing.
The CORS setup also adds common localhost frontend origins automatically when `ENVIRONMENT` is not `production`.

## Resume file storage

- Uploaded resume files are stored on the backend filesystem, not in the database
- Parsed text, normalized text, and structured resume data are stored in PostgreSQL
- New uploads use a durable storage directory configured by `RESUME_STORAGE_DIR`
- If `RESUME_STORAGE_DIR` is not set, the backend defaults to `backend/storage/resumes`
- Legacy absolute file paths remain readable so older uploads do not break after this change

## Deployment

This backend is prepared for container-based deployment.

- `serve.py` runs Alembic migrations, then starts Uvicorn; if startup fails it serves a CORS-enabled fallback app so browsers still receive a clear 503 response
- `Dockerfile` builds a minimal Python image and starts the backend with `python serve.py`
- `railway.toml` configures Railway to build from the Dockerfile and run the same bootstrap command
- `main.py` at the backend root still exposes `main:app` for local Uvicorn compatibility and wraps startup failures in the same fallback behavior

### Frontend to backend flow

- Deploy the Next.js frontend on Vercel
- Deploy the FastAPI backend on Railway
- Set `ALLOWED_ORIGIN` on Railway to the Vercel frontend URL
- Set `NEXT_PUBLIC_API_URL` on Vercel to the Railway backend API URL, for example `https://your-api.up.railway.app/api/v1`

That keeps browser requests explicit: Vercel serves the frontend, and the browser calls Railway only from approved origins.

## Database and migrations

- SQLAlchemy models live in `app/models/`
- Pydantic schemas live in `app/schemas/`
- Alembic configuration lives in `alembic.ini` and `alembic/`
- The initial migration is `alembic/versions/0001_initial_schema.py`

Once dependencies are installed and `DATABASE_URL` is set, typical commands are:

1. `alembic upgrade head`
2. `alembic downgrade -1`

`DATABASE_URL` can use SQLAlchemy's psycopg3 dialect, for example `postgresql+psycopg://...?...sslmode=require`, and the same value is used by both the app engine and Alembic.
