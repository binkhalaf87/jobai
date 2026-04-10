# Setup Notes

## Frontend

1. Move into `frontend/`
2. Install dependencies with your package manager
3. Run the local Next.js development server

## Backend

1. Create and activate a virtual environment inside `backend/`
2. Install dependencies from `requirements.txt`
3. Run the FastAPI app with Uvicorn pointing at `app.main:app`

## Notes

- Environment variables are intentionally not defined yet
- Shared contracts between frontend and backend should be introduced only when API shapes are stable
- CI, containerization, and deployment files can be added once runtime targets are chosen
