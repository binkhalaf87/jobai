"""Parse GOSI (Social Insurance) Excel reports and compute Saudization summary stats."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Common Arabic/English column name aliases for GOSI exports
_NAME_ALIASES = {"الاسم", "اسم الموظف", "name", "employee name", "full name"}
_ID_ALIASES = {"رقم الهوية", "رقم الإقامة", "هوية", "national id", "iqama", "id number", "رقم الوثيقة"}
_NATIONALITY_ALIASES = {"الجنسية", "nationality", "جنسية"}
_JOB_ALIASES = {"المهنة", "المسمى الوظيفي", "job title", "profession", "occupation", "وظيفة", "مهنة"}
_GENDER_ALIASES = {"الجنس", "gender", "sex", "جنس"}
_HIRE_DATE_ALIASES = {"تاريخ التعيين", "تاريخ الالتحاق", "hire date", "start date", "joining date"}

SAUDI_NATIONALITY_VALUES = {"سعودي", "سعودية", "saudi", "saudi arabia", "sa", "سعودي/ة"}


def _normalize(val: str) -> str:
    return str(val).strip().lower()


def _match_column(col_name: str, aliases: set[str]) -> bool:
    n = _normalize(col_name)
    return any(alias in n or n in alias for alias in aliases)


def _find_column(headers: list[str], aliases: set[str]) -> int | None:
    for i, h in enumerate(headers):
        if _match_column(str(h), aliases):
            return i
    return None


def parse_gosi_excel(file_path: Path) -> dict[str, Any]:
    """
    Parse a GOSI Excel file and return employees list + summary stats.

    Returns:
        {
            "employees": [...],
            "summary": {
                "total": int,
                "saudi_count": int,
                "non_saudi_count": int,
                "saudization_pct": float,
                "by_profession": {title: {"total": int, "saudi": int, "pct": float}}
            }
        }
    """
    try:
        import openpyxl
    except ImportError:
        raise RuntimeError("openpyxl is required for Excel parsing. Add it to requirements.txt.")

    wb = openpyxl.load_workbook(str(file_path), read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return {"employees": [], "summary": _empty_summary()}

    # Find header row (first row with recognizable column)
    header_row_idx = 0
    headers: list[str] = []
    for idx, row in enumerate(rows[:10]):
        row_strs = [str(c) if c is not None else "" for c in row]
        if any(_match_column(h, _NATIONALITY_ALIASES | _JOB_ALIASES) for h in row_strs):
            header_row_idx = idx
            headers = row_strs
            break
    else:
        headers = [str(c) if c is not None else f"col_{i}" for i, c in enumerate(rows[0])]

    name_idx = _find_column(headers, _NAME_ALIASES)
    id_idx = _find_column(headers, _ID_ALIASES)
    nat_idx = _find_column(headers, _NATIONALITY_ALIASES)
    job_idx = _find_column(headers, _JOB_ALIASES)
    gender_idx = _find_column(headers, _GENDER_ALIASES)
    hire_idx = _find_column(headers, _HIRE_DATE_ALIASES)

    employees: list[dict] = []
    for row in rows[header_row_idx + 1:]:
        if not any(row):
            continue

        def get(idx: int | None) -> str | None:
            if idx is None or idx >= len(row):
                return None
            v = row[idx]
            return str(v).strip() if v is not None else None

        nationality = get(nat_idx) or ""
        employees.append({
            "name": get(name_idx),
            "national_id": get(id_idx),
            "nationality": nationality,
            "job_title": get(job_idx),
            "gender": get(gender_idx),
            "hire_date": get(hire_idx),
            "is_saudi": _normalize(nationality) in {_normalize(v) for v in SAUDI_NATIONALITY_VALUES},
        })

    wb.close()
    summary = _compute_summary(employees)
    return {"employees": employees, "summary": summary}


def _compute_summary(employees: list[dict]) -> dict[str, Any]:
    total = len(employees)
    saudi_count = sum(1 for e in employees if e.get("is_saudi"))
    non_saudi_count = total - saudi_count
    saudization_pct = round((saudi_count / total * 100), 2) if total > 0 else 0.0

    by_profession: dict[str, dict] = {}
    for emp in employees:
        title = (emp.get("job_title") or "غير محدد").strip() or "غير محدد"
        if title not in by_profession:
            by_profession[title] = {"total": 0, "saudi": 0, "pct": 0.0}
        by_profession[title]["total"] += 1
        if emp.get("is_saudi"):
            by_profession[title]["saudi"] += 1

    for title, stats in by_profession.items():
        t = stats["total"]
        stats["pct"] = round((stats["saudi"] / t * 100), 2) if t > 0 else 0.0

    return {
        "total": total,
        "saudi_count": saudi_count,
        "non_saudi_count": non_saudi_count,
        "saudization_pct": saudization_pct,
        "by_profession": by_profession,
    }


def _empty_summary() -> dict[str, Any]:
    return {"total": 0, "saudi_count": 0, "non_saudi_count": 0, "saudization_pct": 0.0, "by_profession": {}}
