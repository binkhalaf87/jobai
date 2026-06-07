"""Recruiter saudization (Nitaqat) management routes."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_recruiter
from app.api.deps.db import get_db
from app.models.enums import SaudizationAIStatus, SaudizationProcessingStatus
from app.models.recruiter_company import RecruiterCompany
from app.models.saudization_analysis import SaudizationAnalysis
from app.models.saudization_decision import SaudizationDecision
from app.models.saudization_report import SaudizationReport
from app.models.user import User
from app.services.saudization.calculator import compute_gap_analysis
from app.services.storage import get_storage

router = APIRouter(prefix="/recruiter/saudization", tags=["recruiter-saudization"])

_MAX_PDF_SIZE = 20 * 1024 * 1024   # 20 MB
_MAX_EXCEL_SIZE = 10 * 1024 * 1024  # 10 MB

# ── Schemas ────────────────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    name: str
    cr_number: str | None = None

class CompanyOut(BaseModel):
    id: str
    name: str
    cr_number: str | None

class DecisionOut(BaseModel):
    id: str
    company_id: str
    company_name: str
    source_filename: str | None
    decision_number: str | None
    decision_date: str | None
    decision_title: str | None
    issuing_authority: str | None
    targeted_professions: list | None
    processing_status: str
    created_at: str

class ReportOut(BaseModel):
    id: str
    company_id: str
    company_name: str
    source_filename: str | None
    report_date: str | None
    report_label: str | None
    summary: dict | None
    processing_status: str
    created_at: str

class AnalysisCreate(BaseModel):
    decision_id: str
    report_id: str

class AnalysisOut(BaseModel):
    id: str
    decision_id: str
    report_id: str
    current_pct: float | None
    target_pct: float | None
    gap_pct: float | None
    profession_gaps: list | None
    ai_status: str
    ai_recommendations: str | None
    decision: DecisionOut | None = None
    report: ReportOut | None = None

# ── Companies ──────────────────────────────────────────────────────────────────

@router.get("/companies", response_model=list[CompanyOut])
def list_companies(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(RecruiterCompany)
        .where(RecruiterCompany.user_id == current_user.id)
        .order_by(RecruiterCompany.created_at.desc())
    ).scalars().all()
    return [CompanyOut(id=r.id, name=r.name, cr_number=r.cr_number) for r in rows]


@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    body: CompanyCreate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    company = RecruiterCompany(user_id=current_user.id, name=body.name.strip(), cr_number=body.cr_number)
    db.add(company)
    db.commit()
    db.refresh(company)
    return CompanyOut(id=company.id, name=company.name, cr_number=company.cr_number)

# ── Decisions ──────────────────────────────────────────────────────────────────

@router.post("/decisions/upload", response_model=DecisionOut, status_code=status.HTTP_201_CREATED)
async def upload_decision(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    company_id: str = Form(""),
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id is required")
    _assert_company_owned(company_id, current_user.id, db)

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_PDF_SIZE:
        raise HTTPException(status_code=413, detail="PDF file exceeds 20 MB limit.")
    if not (file_bytes[:4] == b"%PDF" or b"PDF" in file_bytes[:10]):
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    storage_key = f"saudization/decisions/{current_user.id}/{uuid.uuid4()}.pdf"
    storage = get_storage()
    storage.upload(storage_key, file_bytes, content_type="application/pdf")

    decision = SaudizationDecision(
        recruiter_id=current_user.id,
        company_id=company_id,
        source_filename=file.filename,
        storage_key=storage_key,
        processing_status=SaudizationProcessingStatus.UPLOADED,
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    background_tasks.add_task(_extract_decision_task, decision.id, storage_key, storage)

    company = db.get(RecruiterCompany, company_id)
    return _decision_out(decision, company.name if company else "")


@router.get("/decisions", response_model=list[DecisionOut])
def list_decisions(
    company_id: str | None = None,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    q = select(SaudizationDecision).where(SaudizationDecision.recruiter_id == current_user.id)
    if company_id:
        q = q.where(SaudizationDecision.company_id == company_id)
    rows = db.execute(q.order_by(SaudizationDecision.created_at.desc())).scalars().all()

    company_names = _load_company_names([r.company_id for r in rows], db)
    return [_decision_out(r, company_names.get(r.company_id, "")) for r in rows]


@router.get("/decisions/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: str,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(decision_id, current_user.id, db)
    company = db.get(RecruiterCompany, decision.company_id)
    return _decision_out(decision, company.name if company else "")

# ── GOSI Reports ───────────────────────────────────────────────────────────────

@router.post("/reports/upload", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def upload_report(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    company_id: str = Form(""),
    report_date: str = Form(""),
    report_label: str = Form(""),
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id is required")
    _assert_company_owned(company_id, current_user.id, db)

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_EXCEL_SIZE:
        raise HTTPException(status_code=413, detail="Excel file exceeds 10 MB limit.")

    fname = (file.filename or "").lower()
    if not (fname.endswith(".xlsx") or fname.endswith(".xls")):
        raise HTTPException(status_code=400, detail="File must be an Excel (.xlsx or .xls).")

    ext = ".xlsx" if fname.endswith(".xlsx") else ".xls"
    storage_key = f"saudization/reports/{current_user.id}/{uuid.uuid4()}{ext}"
    storage = get_storage()
    storage.upload(storage_key, file_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    report = SaudizationReport(
        recruiter_id=current_user.id,
        company_id=company_id,
        source_filename=file.filename,
        storage_key=storage_key,
        report_date=report_date or None,
        report_label=report_label or None,
        processing_status=SaudizationProcessingStatus.UPLOADED,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    background_tasks.add_task(_parse_report_task, report.id, storage_key, storage)

    company = db.get(RecruiterCompany, company_id)
    return _report_out(report, company.name if company else "")


@router.get("/reports", response_model=list[ReportOut])
def list_reports(
    company_id: str | None = None,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    q = select(SaudizationReport).where(SaudizationReport.recruiter_id == current_user.id)
    if company_id:
        q = q.where(SaudizationReport.company_id == company_id)
    rows = db.execute(q.order_by(SaudizationReport.created_at.desc())).scalars().all()

    company_names = _load_company_names([r.company_id for r in rows], db)
    return [_report_out(r, company_names.get(r.company_id, "")) for r in rows]

# ── Analyses ───────────────────────────────────────────────────────────────────

@router.post("/analyses", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
def create_analysis(
    body: AnalysisCreate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(body.decision_id, current_user.id, db)
    report = _get_owned_report(body.report_id, current_user.id, db)

    if decision.processing_status != SaudizationProcessingStatus.EXTRACTED:
        raise HTTPException(status_code=400, detail="القرار لم يكتمل استخراجه بعد.")
    if report.processing_status != SaudizationProcessingStatus.EXTRACTED:
        raise HTTPException(status_code=400, detail="تقرير GOSI لم يكتمل معالجته بعد.")

    summary = report.summary or {}
    total = summary.get("total", 0)
    saudi = summary.get("saudi_count", 0)
    by_profession = summary.get("by_profession", {})
    targeted = decision.targeted_professions or []

    gap = compute_gap_analysis(targeted, by_profession, total, saudi)

    analysis = SaudizationAnalysis(
        recruiter_id=current_user.id,
        decision_id=decision.id,
        report_id=report.id,
        current_pct=gap["current_pct"],
        target_pct=gap["target_pct"],
        gap_pct=gap["gap_pct"],
        profession_gaps=gap["profession_gaps"],
        ai_status=SaudizationAIStatus.PENDING,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    company_decision = db.get(RecruiterCompany, decision.company_id)
    company_report = db.get(RecruiterCompany, report.company_id)
    dec_out = _decision_out(decision, company_decision.name if company_decision else "")
    rep_out = _report_out(report, company_report.name if company_report else "")

    return _analysis_out(analysis, dec_out, rep_out)


@router.get("/analyses", response_model=list[AnalysisOut])
def list_analyses(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(SaudizationAnalysis)
        .where(SaudizationAnalysis.recruiter_id == current_user.id)
        .order_by(SaudizationAnalysis.created_at.desc())
    ).scalars().all()
    return [_analysis_out(r) for r in rows]


@router.get("/analyses/{analysis_id}", response_model=AnalysisOut)
def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    analysis = _get_owned_analysis(analysis_id, current_user.id, db)
    decision = db.get(SaudizationDecision, analysis.decision_id)
    report = db.get(SaudizationReport, analysis.report_id)
    dec_company = db.get(RecruiterCompany, decision.company_id) if decision else None
    rep_company = db.get(RecruiterCompany, report.company_id) if report else None
    dec_out = _decision_out(decision, dec_company.name if dec_company else "") if decision else None
    rep_out = _report_out(report, rep_company.name if rep_company else "") if report else None
    return _analysis_out(analysis, dec_out, rep_out)


@router.post("/analyses/{analysis_id}/ai", response_model=AnalysisOut)
def generate_ai_recommendations(
    analysis_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    analysis = _get_owned_analysis(analysis_id, current_user.id, db)

    if analysis.ai_status == SaudizationAIStatus.COMPLETED:
        decision = db.get(SaudizationDecision, analysis.decision_id)
        report = db.get(SaudizationReport, analysis.report_id)
        dec_company = db.get(RecruiterCompany, decision.company_id) if decision else None
        rep_company = db.get(RecruiterCompany, report.company_id) if report else None
        return _analysis_out(
            analysis,
            _decision_out(decision, dec_company.name if dec_company else "") if decision else None,
            _report_out(report, rep_company.name if rep_company else "") if report else None,
        )

    analysis.ai_status = SaudizationAIStatus.PENDING
    db.commit()

    background_tasks.add_task(_generate_ai_task, analysis_id)
    db.refresh(analysis)
    return _analysis_out(analysis)

# ── Background tasks ───────────────────────────────────────────────────────────

def _extract_decision_task(decision_id: str, storage_key: str, storage) -> None:
    from app.db.session import SessionLocal
    from app.services.saudization.pdf_decision_extractor import extract_decision_from_pdf
    import tempfile, os

    db = SessionLocal()
    try:
        decision = db.get(SaudizationDecision, decision_id)
        if not decision:
            return

        decision.processing_status = SaudizationProcessingStatus.PROCESSING
        db.commit()

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            file_bytes = storage.download(storage_key)
            with open(tmp_path, "wb") as f:
                f.write(file_bytes)

            result = extract_decision_from_pdf(Path(tmp_path))
        finally:
            os.unlink(tmp_path)

        decision.decision_number = result.get("decision_number")
        decision.decision_date = result.get("decision_date")
        decision.decision_title = result.get("decision_title")
        decision.issuing_authority = result.get("issuing_authority")
        decision.targeted_professions = result.get("targeted_professions", [])
        decision.raw_text = result.get("raw_text")
        decision.ai_extracted_data = result
        decision.processing_status = SaudizationProcessingStatus.EXTRACTED
        db.commit()
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Failed to extract decision %s", decision_id)
        try:
            decision = db.get(SaudizationDecision, decision_id)
            if decision:
                decision.processing_status = SaudizationProcessingStatus.FAILED
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _parse_report_task(report_id: str, storage_key: str, storage) -> None:
    from app.db.session import SessionLocal
    from app.services.saudization.gosi_excel_parser import parse_gosi_excel
    import tempfile, os

    db = SessionLocal()
    try:
        report = db.get(SaudizationReport, report_id)
        if not report:
            return

        report.processing_status = SaudizationProcessingStatus.PROCESSING
        db.commit()

        ext = ".xlsx" if (storage_key or "").endswith(".xlsx") else ".xls"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp_path = tmp.name
        try:
            file_bytes = storage.download(storage_key)
            with open(tmp_path, "wb") as f:
                f.write(file_bytes)

            result = parse_gosi_excel(Path(tmp_path))
        finally:
            os.unlink(tmp_path)

        report.employees = result["employees"]
        report.summary = result["summary"]
        report.processing_status = SaudizationProcessingStatus.EXTRACTED
        db.commit()
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Failed to parse GOSI report %s", report_id)
        try:
            report = db.get(SaudizationReport, report_id)
            if report:
                report.processing_status = SaudizationProcessingStatus.FAILED
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _generate_ai_task(analysis_id: str) -> None:
    from app.db.session import SessionLocal
    from app.services.saudization.ai_service import generate_recommendations

    db = SessionLocal()
    try:
        analysis = db.get(SaudizationAnalysis, analysis_id)
        if not analysis:
            return

        decision = db.get(SaudizationDecision, analysis.decision_id)
        report = db.get(SaudizationReport, analysis.report_id)

        summary = (report.summary or {}) if report else {}

        text = generate_recommendations(
            decision_title=decision.decision_title if decision else None,
            decision_number=decision.decision_number if decision else None,
            current_pct=analysis.current_pct or 0,
            target_pct=analysis.target_pct or 0,
            gap_pct=analysis.gap_pct or 0,
            profession_gaps=analysis.profession_gaps or [],
            total_employees=summary.get("total", 0),
            saudi_count=summary.get("saudi_count", 0),
        )

        analysis.ai_recommendations = text
        analysis.ai_status = SaudizationAIStatus.COMPLETED
        db.commit()
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Failed to generate AI recommendations for analysis %s", analysis_id)
        try:
            analysis = db.get(SaudizationAnalysis, analysis_id)
            if analysis:
                analysis.ai_status = SaudizationAIStatus.FAILED
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

# ── Helpers ────────────────────────────────────────────────────────────────────

def _assert_company_owned(company_id: str, user_id: str, db: Session) -> RecruiterCompany:
    company = db.get(RecruiterCompany, company_id)
    if not company or company.user_id != user_id:
        raise HTTPException(status_code=404, detail="Company not found.")
    return company


def _get_owned_decision(decision_id: str, user_id: str, db: Session) -> SaudizationDecision:
    decision = db.get(SaudizationDecision, decision_id)
    if not decision or decision.recruiter_id != user_id:
        raise HTTPException(status_code=404, detail="Decision not found.")
    return decision


def _get_owned_report(report_id: str, user_id: str, db: Session) -> SaudizationReport:
    report = db.get(SaudizationReport, report_id)
    if not report or report.recruiter_id != user_id:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


def _get_owned_analysis(analysis_id: str, user_id: str, db: Session) -> SaudizationAnalysis:
    analysis = db.get(SaudizationAnalysis, analysis_id)
    if not analysis or analysis.recruiter_id != user_id:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


def _load_company_names(company_ids: list[str], db: Session) -> dict[str, str]:
    unique = list(set(company_ids))
    if not unique:
        return {}
    rows = db.execute(select(RecruiterCompany).where(RecruiterCompany.id.in_(unique))).scalars().all()
    return {r.id: r.name for r in rows}


def _decision_out(d: SaudizationDecision, company_name: str = "") -> DecisionOut:
    return DecisionOut(
        id=d.id,
        company_id=d.company_id,
        company_name=company_name,
        source_filename=d.source_filename,
        decision_number=d.decision_number,
        decision_date=d.decision_date,
        decision_title=d.decision_title,
        issuing_authority=d.issuing_authority,
        targeted_professions=d.targeted_professions,
        processing_status=d.processing_status.value,
        created_at=d.created_at.isoformat(),
    )


def _report_out(r: SaudizationReport, company_name: str = "") -> ReportOut:
    return ReportOut(
        id=r.id,
        company_id=r.company_id,
        company_name=company_name,
        source_filename=r.source_filename,
        report_date=r.report_date,
        report_label=r.report_label,
        summary=r.summary,
        processing_status=r.processing_status.value,
        created_at=r.created_at.isoformat(),
    )


def _analysis_out(
    a: SaudizationAnalysis,
    decision: DecisionOut | None = None,
    report: ReportOut | None = None,
) -> AnalysisOut:
    return AnalysisOut(
        id=a.id,
        decision_id=a.decision_id,
        report_id=a.report_id,
        current_pct=a.current_pct,
        target_pct=a.target_pct,
        gap_pct=a.gap_pct,
        profession_gaps=a.profession_gaps,
        ai_status=a.ai_status.value,
        ai_recommendations=a.ai_recommendations,
        decision=decision,
        report=report,
    )
