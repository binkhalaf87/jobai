from fastapi import APIRouter

from app.api.routes.analysis import router as analysis_router
from app.api.routes.auth import router as auth_router
from app.api.routes.billing import router as billing_router
from app.api.routes.interviews import router as interviews_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.smart_send import router as smart_send_router
from app.api.routes.system import router as system_router

# This router becomes the single entrypoint for versioned API route groups.
api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(resumes_router)
api_router.include_router(analysis_router)
api_router.include_router(billing_router)
api_router.include_router(interviews_router)
api_router.include_router(jobs_router)
api_router.include_router(smart_send_router)
api_router.include_router(system_router)
