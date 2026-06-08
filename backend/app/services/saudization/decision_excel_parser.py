"""Parse saudization decision Excel files into structured decision + profession data."""

from __future__ import annotations

import logging
from io import BytesIO
from typing import Any

logger = logging.getLogger(__name__)

# ── Column aliases ─────────────────────────────────────────────────────────────

_PROF_ALIASES       = {"المهنة", "اسم المهنة", "مهنة", "النشاط", "القطاع", "الوظيفة",
                        "profession", "job title", "activity", "sector", "occupation"}
_TARGET_ALIASES     = {"نسبة التوطين", "النسبة المستهدفة", "نسبة", "هدف", "الهدف",
                        "target", "target %", "percentage", "target percentage", "نسبة التوطين %"}
_MIN_EMP_ALIASES    = {"الحد الأدنى للموظفين", "الحد الأدنى", "عدد الموظفين", "حد ادنى",
                        "min employees", "minimum employees", "minimum"}
_MIN_SAL_ALIASES    = {"الراتب الأدنى", "أدنى راتب", "الحد الأدنى للراتب", "راتب",
                        "min salary", "minimum salary", "salary"}
_CALC_ALIASES       = {"طريقة الاحتساب", "الاحتساب", "طريقة", "كيفية الاحتساب",
                        "calculation", "calculation method", "method"}
_DEC_NUM_ALIASES    = {"رقم القرار", "القرار", "رقم", "decision number", "decision #", "decision no"}
_DEC_DATE_ALIASES   = {"تاريخ القرار", "التاريخ", "decision date", "date"}
_DEC_AUTH_ALIASES   = {"الجهة المصدرة", "الجهة", "issuing authority", "authority", "issued by"}
_DEC_TITLE_ALIASES  = {"عنوان القرار", "العنوان", "الموضوع", "title", "subject"}
_DEC_DEF_ALIASES    = {"تعريف القرار", "الوصف", "تعريف", "وصف", "definition", "description"}
_NOTES_ALIASES      = {"ملاحظات", "ملاحظة", "notes", "note", "remarks"}


def _norm(v: Any) -> str:
    return str(v).strip().lower() if v is not None else ""


def _match(header: str, aliases: set[str]) -> bool:
    h = _norm(header)
    return any(a in h or h in a for a in aliases)


def _find_col(headers: list[str], aliases: set[str]) -> int | None:
    for i, h in enumerate(headers):
        if _match(h, aliases):
            return i
    return None


def _val(row: tuple, idx: int | None) -> str | None:
    if idx is None or idx >= len(row):
        return None
    v = row[idx]
    return str(v).strip() if v is not None else None


def parse_decision_excel(file_bytes: bytes) -> list[dict[str, Any]]:
    """
    Parse an Excel file containing saudization decision data.

    Returns a list of decision dicts, each with:
        decision_number, decision_date, decision_title,
        issuing_authority, decision_definition,
        targeted_professions: [{name, target_percentage, min_employees,
                                min_salary, calculation_method, notes}]

    Rows are grouped by decision_number. If no decision_number column,
    all rows go into one decision.
    """
    import openpyxl

    wb = openpyxl.load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    all_rows = list(ws.iter_rows(values_only=True))
    wb.close()

    if not all_rows:
        return []

    # Find header row (first row with a profession or target column)
    header_idx = 0
    headers: list[str] = []
    for idx, row in enumerate(all_rows[:8]):
        row_strs = [str(c) if c is not None else "" for c in row]
        if any(_match(h, _PROF_ALIASES | _TARGET_ALIASES) for h in row_strs):
            header_idx = idx
            headers = row_strs
            break
    else:
        headers = [str(c) if c is not None else f"col_{i}" for i, c in enumerate(all_rows[0])]

    # Map column indices
    col = {
        "profession":   _find_col(headers, _PROF_ALIASES),
        "target":       _find_col(headers, _TARGET_ALIASES),
        "min_emp":      _find_col(headers, _MIN_EMP_ALIASES),
        "min_sal":      _find_col(headers, _MIN_SAL_ALIASES),
        "calc":         _find_col(headers, _CALC_ALIASES),
        "dec_num":      _find_col(headers, _DEC_NUM_ALIASES),
        "dec_date":     _find_col(headers, _DEC_DATE_ALIASES),
        "dec_auth":     _find_col(headers, _DEC_AUTH_ALIASES),
        "dec_title":    _find_col(headers, _DEC_TITLE_ALIASES),
        "dec_def":      _find_col(headers, _DEC_DEF_ALIASES),
        "notes":        _find_col(headers, _NOTES_ALIASES),
    }

    if col["profession"] is None and col["target"] is None:
        raise ValueError(
            "لم يُعثر على عمود المهنة أو نسبة التوطين. "
            "تأكد أن الملف يحتوي على: المهنة، نسبة التوطين."
        )

    # Parse data rows
    decisions: dict[str, dict] = {}   # keyed by decision_number (or "_default")

    for row in all_rows[header_idx + 1:]:
        if not any(row):
            continue

        prof_name = _val(row, col["profession"])
        if not prof_name:
            continue  # skip rows without a profession name

        # Parse target percentage
        raw_target = _val(row, col["target"])
        try:
            target_pct = float(str(raw_target).replace("%", "").replace("٪", "").strip()) if raw_target else 0.0
        except ValueError:
            target_pct = 0.0

        # Parse min_employees
        raw_min_emp = _val(row, col["min_emp"])
        try:
            min_emp = int(float(raw_min_emp)) if raw_min_emp else 1
        except ValueError:
            min_emp = 1

        # Parse min_salary
        raw_min_sal = _val(row, col["min_sal"])
        try:
            min_sal = float(str(raw_min_sal).replace(",", "").strip()) if raw_min_sal else None
        except ValueError:
            min_sal = None

        profession_entry = {
            "name":               prof_name,
            "target_percentage":  target_pct,
            "min_employees":      min_emp,
            "min_salary":         min_sal,
            "calculation_method": _val(row, col["calc"]),
            "notes":              _val(row, col["notes"]),
        }

        # Decision grouping key
        dec_num  = _val(row, col["dec_num"])  or "_default"
        dec_date = _val(row, col["dec_date"])
        dec_auth = _val(row, col["dec_auth"])
        dec_title= _val(row, col["dec_title"])
        dec_def  = _val(row, col["dec_def"])

        if dec_num not in decisions:
            decisions[dec_num] = {
                "decision_number":    dec_num if dec_num != "_default" else None,
                "decision_date":      dec_date,
                "decision_title":     dec_title,
                "issuing_authority":  dec_auth,
                "decision_definition":dec_def,
                "targeted_professions": [],
            }
        else:
            # Fill in any missing decision-level metadata from later rows
            d = decisions[dec_num]
            if not d["decision_date"]      and dec_date:  d["decision_date"]       = dec_date
            if not d["issuing_authority"]  and dec_auth:  d["issuing_authority"]   = dec_auth
            if not d["decision_title"]     and dec_title: d["decision_title"]      = dec_title
            if not d["decision_definition"]and dec_def:   d["decision_definition"] = dec_def

        decisions[dec_num]["targeted_professions"].append(profession_entry)

    return list(decisions.values())
