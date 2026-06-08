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
    company_id: str | None
    company_name: str | None
    source_filename: str | None
    decision_number: str | None
    decision_date: str | None
    decision_title: str | None
    issuing_authority: str | None
    decision_definition: str | None = None
    general_notes: str | None = None
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
    decision_ids: list[str]   # one or more decision IDs
    report_id: str

class AnalysisOut(BaseModel):
    id: str
    decision_id: str
    decision_ids: list[str] | None = None
    report_id: str
    current_pct: float | None
    target_pct: float | None
    gap_pct: float | None
    profession_gaps: list | None
    active_sectors: list | None = None
    future_sectors: list | None = None
    compliant_count: int | None = None
    violation_count: int | None = None
    below_limit_count: int | None = None
    active_sector_count: int | None = None
    unclassified_total: int | None = None
    unclassified_saudi: int | None = None
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

class ProfessionBody(BaseModel):
    name: str
    target_percentage: float = 0.0
    min_employees: int = 1
    min_salary: float | None = None
    calculation_method: str | None = None
    notes: str | None = None


class DecisionMetaUpdate(BaseModel):
    decision_number: str | None = None
    decision_date: str | None = None
    decision_title: str | None = None
    issuing_authority: str | None = None
    decision_definition: str | None = None


@router.post("/decisions/upload-excel", response_model=list[DecisionOut], status_code=status.HTTP_201_CREATED)
async def upload_decisions_excel(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    """Upload an Excel file with decision/profession rows; returns all created decisions."""
    fname = (file.filename or "").lower()
    if not (fname.endswith(".xlsx") or fname.endswith(".xls")):
        raise HTTPException(status_code=400, detail="الملف يجب أن يكون Excel (.xlsx أو .xls).")

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_EXCEL_SIZE:
        raise HTTPException(status_code=413, detail="حجم الملف يتجاوز 10 MB.")

    from app.services.saudization.decision_excel_parser import parse_decision_excel
    try:
        parsed = parse_decision_excel(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not parsed:
        raise HTTPException(status_code=422, detail="لم يُعثر على بيانات في الملف.")

    created = []
    for p in parsed:
        decision = SaudizationDecision(
            recruiter_id=current_user.id,
            source_filename=file.filename,
            decision_number=p.get("decision_number"),
            decision_date=p.get("decision_date"),
            decision_title=p.get("decision_title"),
            issuing_authority=p.get("issuing_authority"),
            decision_definition=p.get("decision_definition"),
            targeted_professions=p.get("targeted_professions", []),
            processing_status=SaudizationProcessingStatus.EXTRACTED,
        )
        db.add(decision)
        created.append(decision)

    db.commit()
    for d in created:
        db.refresh(d)

    return [_decision_out(d) for d in created]


@router.get("/decisions", response_model=list[DecisionOut])
def list_decisions(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(SaudizationDecision)
        .where(SaudizationDecision.recruiter_id == current_user.id)
        .order_by(SaudizationDecision.created_at.desc())
    ).scalars().all()
    return [_decision_out(r) for r in rows]


@router.get("/decisions/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: str,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(decision_id, current_user.id, db)
    return _decision_out(decision)


@router.patch("/decisions/{decision_id}", response_model=DecisionOut)
def update_decision_meta(
    decision_id: str,
    body: DecisionMetaUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(decision_id, current_user.id, db)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(decision, field, val)
    db.commit()
    db.refresh(decision)
    return _decision_out(decision)


@router.delete("/decisions/{decision_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_decision(
    decision_id: str,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(decision_id, current_user.id, db)
    db.delete(decision)
    db.commit()


# ── Profession CRUD (within a decision) ───────────────────────────────────────

@router.post("/decisions/{decision_id}/professions", response_model=DecisionOut)
def add_profession(
    decision_id: str,
    body: ProfessionBody,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(decision_id, current_user.id, db)
    profs = list(decision.targeted_professions or [])
    profs.append(body.model_dump())
    decision.targeted_professions = profs
    db.commit()
    db.refresh(decision)
    return _decision_out(decision)


@router.put("/decisions/{decision_id}/professions/{idx}", response_model=DecisionOut)
def update_profession(
    decision_id: str,
    idx: int,
    body: ProfessionBody,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(decision_id, current_user.id, db)
    profs = list(decision.targeted_professions or [])
    if idx < 0 or idx >= len(profs):
        raise HTTPException(status_code=404, detail="المهنة غير موجودة.")
    profs[idx] = body.model_dump()
    decision.targeted_professions = profs
    db.commit()
    db.refresh(decision)
    return _decision_out(decision)


@router.delete("/decisions/{decision_id}/professions/{idx}", response_model=DecisionOut)
def delete_profession(
    decision_id: str,
    idx: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    decision = _get_owned_decision(decision_id, current_user.id, db)
    profs = list(decision.targeted_professions or [])
    if idx < 0 or idx >= len(profs):
        raise HTTPException(status_code=404, detail="المهنة غير موجودة.")
    profs.pop(idx)
    decision.targeted_professions = profs
    db.commit()
    db.refresh(decision)
    return _decision_out(decision)

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

    # Validate required columns before saving
    from app.services.saudization.gosi_excel_parser import validate_gosi_excel_bytes
    col_errors = validate_gosi_excel_bytes(file_bytes)
    if col_errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "الملف لا يحتوي على الأعمدة المطلوبة", "errors": col_errors},
        )

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
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    if not body.decision_ids:
        raise HTTPException(status_code=400, detail="يجب تحديد قرار واحد على الأقل.")

    decisions = []
    for did in body.decision_ids:
        dec = _get_owned_decision(did, current_user.id, db)
        if dec.processing_status != SaudizationProcessingStatus.EXTRACTED:
            raise HTTPException(status_code=400, detail=f"القرار {dec.decision_number or did} لم يكتمل استخراجه بعد.")
        decisions.append(dec)

    report = _get_owned_report(body.report_id, current_user.id, db)
    if report.processing_status != SaudizationProcessingStatus.EXTRACTED:
        raise HTTPException(status_code=400, detail="تقرير GOSI لم يكتمل معالجته بعد.")

    # Aggregate professions from all decisions, tagging each with its decision_number
    all_targeted: list[dict] = []
    for dec in decisions:
        for prof in (dec.targeted_professions or []):
            all_targeted.append({**prof, "decision_number": dec.decision_number})

    summary = report.summary or {}
    total = summary.get("total", 0)
    saudi = summary.get("saudi_count", 0)
    by_profession = summary.get("by_profession", {})

    gap = compute_gap_analysis(all_targeted, by_profession, total, saudi)

    # Store the rich dict in profession_gaps for the dashboard
    rich_gaps = {
        "active_sectors": gap["active_sectors"],
        "future_sectors": gap["future_sectors"],
        "profession_gaps": gap["profession_gaps"],
        "compliant_count": gap["compliant_count"],
        "violation_count": gap["violation_count"],
        "below_limit_count": gap["below_limit_count"],
        "active_sector_count": gap["active_sector_count"],
        "unclassified_total": gap["unclassified_total"],
        "unclassified_saudi": gap["unclassified_saudi"],
    }

    primary_decision = decisions[0]
    analysis = SaudizationAnalysis(
        recruiter_id=current_user.id,
        decision_id=primary_decision.id,
        decision_ids=body.decision_ids,
        report_id=report.id,
        current_pct=gap["current_pct"],
        target_pct=gap["target_pct"],
        gap_pct=gap["gap_pct"],
        profession_gaps=rich_gaps,
        ai_status=SaudizationAIStatus.PENDING,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    background_tasks.add_task(_generate_ai_task, analysis.id)

    company_decision = db.get(RecruiterCompany, primary_decision.company_id)
    company_report = db.get(RecruiterCompany, report.company_id)
    dec_out = _decision_out(primary_decision, company_decision.name if company_decision else "")
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
        gaps = analysis.profession_gaps
        active_sectors = gaps.get("active_sectors", []) if isinstance(gaps, dict) else (gaps or [])
        profession_gaps_list = gaps.get("profession_gaps", active_sectors) if isinstance(gaps, dict) else (gaps or [])

        # Collect all decision titles/numbers used
        decision_ids = analysis.decision_ids or [analysis.decision_id]
        decisions = [db.get(SaudizationDecision, did) for did in decision_ids if did]
        decisions = [d for d in decisions if d]
        decision_title = "; ".join(d.decision_title for d in decisions if d.decision_title) or None
        decision_number = "; ".join(d.decision_number for d in decisions if d.decision_number) or None

        text = generate_recommendations(
            decision_title=decision_title,
            decision_number=decision_number,
            current_pct=analysis.current_pct or 0,
            target_pct=analysis.target_pct or 0,
            gap_pct=analysis.gap_pct or 0,
            profession_gaps=profession_gaps_list,
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


def _decision_out(d: SaudizationDecision, company_name: str | None = None) -> DecisionOut:
    ai_data = d.ai_extracted_data or {}
    return DecisionOut(
        id=d.id,
        company_id=d.company_id,
        company_name=company_name,
        source_filename=d.source_filename,
        decision_number=d.decision_number,
        decision_date=d.decision_date,
        decision_title=d.decision_title,
        issuing_authority=d.issuing_authority,
        decision_definition=d.decision_definition,
        general_notes=ai_data.get("general_notes"),
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
    gaps = a.profession_gaps
    if isinstance(gaps, dict):
        active_sectors = gaps.get("active_sectors")
        future_sectors = gaps.get("future_sectors")
        compliant_count = gaps.get("compliant_count")
        violation_count = gaps.get("violation_count")
        below_limit_count = gaps.get("below_limit_count")
        active_sector_count = gaps.get("active_sector_count")
        unclassified_total = gaps.get("unclassified_total", 0)
        unclassified_saudi = gaps.get("unclassified_saudi", 0)
        legacy_gaps = gaps.get("profession_gaps")
    else:
        active_sectors = None
        future_sectors = None
        compliant_count = None
        violation_count = None
        below_limit_count = None
        active_sector_count = None
        unclassified_total = None
        unclassified_saudi = None
        legacy_gaps = gaps

    return AnalysisOut(
        id=a.id,
        decision_id=a.decision_id,
        decision_ids=a.decision_ids,
        report_id=a.report_id,
        current_pct=a.current_pct,
        target_pct=a.target_pct,
        gap_pct=a.gap_pct,
        profession_gaps=legacy_gaps,
        active_sectors=active_sectors,
        future_sectors=future_sectors,
        compliant_count=compliant_count,
        violation_count=violation_count,
        below_limit_count=below_limit_count,
        active_sector_count=active_sector_count,
        unclassified_total=unclassified_total,
        unclassified_saudi=unclassified_saudi,
        ai_status=a.ai_status.value,
        ai_recommendations=a.ai_recommendations,
        decision=decision,
        report=report,
    )
