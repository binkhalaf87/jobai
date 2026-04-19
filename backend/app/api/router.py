from fastapi import APIRouter

from app.api.routes.analysis import router as analysis_router
from app.api.routes.auth import router as auth_router
from app.api.routes.billing import router as billing_router
from app.api.routes.interview_public import router as interview_public_router
from app.api.routes.interviews import router as interviews_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.recruiter.candidates import router as recruiter_candidates_router
from app.api.routes.recruiter.dashboard import router as recruiter_dashboard_router
from app.api.routes.recruiter.interviews import router as recruiter_interviews_router
from app.api.routes.recruiter.jobs import router as recruiter_jobs_router
from app.api.routes.recruiter.reports import router as recruiter_reports_router
from app.api.routes.recruiter.screening import router as recruiter_screening_router
from app.api.routes.recruiter.talent_fit import router as recruiter_talent_fit_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.smart_send import router as smart_send_router
from app.api.routes.system import router as system_router

# This router becomes the single entrypoint for versioned API route groups.
api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(resumes_router)
api_router.include_router(analysis_router)
api_router.include_router(billing_router)
api_router.include_router(interview_public_router)
api_router.include_router(interviews_router)
api_router.include_router(jobs_router)
api_router.include_router(recruiter_candidates_router)
api_router.include_router(recruiter_dashboard_router)
api_router.include_router(recruiter_interviews_router)
api_router.include_router(recruiter_jobs_router)
api_router.include_router(recruiter_reports_router)
api_router.include_router(recruiter_screening_router)
api_router.include_router(recruiter_talent_fit_router)
api_router.include_router(smart_send_router)
api_router.include_router(system_router)
