"""Compute Saudization gap analysis by matching GOSI data against a decision's targets."""

from __future__ import annotations

from typing import Any


def compute_gap_analysis(
    targeted_professions: list[dict],
    by_profession: dict[str, dict],
    total_employees: int,
    saudi_count: int,
) -> dict[str, Any]:
    """
    Compare targeted professions from a decision against actual GOSI data.

    Args:
        targeted_professions: List of {name, target_percentage, notes} from decision.
        by_profession: {title: {total, saudi, pct}} from GOSI summary.
        total_employees: Total headcount from GOSI.
        saudi_count: Total Saudi employees from GOSI.

    Returns:
        {
            current_pct: float,
            target_pct: float,
            gap_pct: float,
            profession_gaps: [{profession, current_count, current_saudi, current_pct, target_pct, gap_pct, needed}]
        }
    """
    current_pct = round((saudi_count / total_employees * 100), 2) if total_employees > 0 else 0.0

    # Overall target: average of targeted profession targets (or max)
    target_pcts = [p.get("target_percentage", 0) for p in targeted_professions if p.get("target_percentage")]
    overall_target = round(sum(target_pcts) / len(target_pcts), 2) if target_pcts else 0.0

    gap_pct = round(overall_target - current_pct, 2)

    profession_gaps = []
    for prof in targeted_professions:
        name = prof.get("name", "")
        target_pct_val = float(prof.get("target_percentage") or 0)

        # Try to find matching profession in GOSI data (fuzzy name match)
        matched_stats = _find_profession(name, by_profession)

        if matched_stats:
            p_total = matched_stats["total"]
            p_saudi = matched_stats["saudi"]
            p_pct = matched_stats["pct"]
        else:
            p_total = 0
            p_saudi = 0
            p_pct = 0.0

        # How many more Saudis needed to reach target in this profession
        needed = 0
        if target_pct_val > 0 and p_total > 0:
            required_saudi = int((target_pct_val / 100) * p_total)
            needed = max(0, required_saudi - p_saudi)

        profession_gaps.append({
            "profession": name,
            "current_count": p_total,
            "current_saudi": p_saudi,
            "current_pct": p_pct,
            "target_pct": target_pct_val,
            "gap_pct": round(target_pct_val - p_pct, 2),
            "needed": needed,
            "notes": prof.get("notes"),
        })

    return {
        "current_pct": current_pct,
        "target_pct": overall_target,
        "gap_pct": gap_pct,
        "profession_gaps": profession_gaps,
    }


def _find_profession(name: str, by_profession: dict[str, dict]) -> dict | None:
    """Find the best matching profession entry (case-insensitive, partial match)."""
    name_lower = name.strip().lower()
    # Exact match first
    for key, val in by_profession.items():
        if key.strip().lower() == name_lower:
            return val
    # Partial match
    for key, val in by_profession.items():
        if name_lower in key.strip().lower() or key.strip().lower() in name_lower:
            return val
    return None
