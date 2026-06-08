"""Compute Saudization gap analysis by matching GOSI data against decision targets."""

from __future__ import annotations

from typing import Any


def compute_gap_analysis(
    targeted_professions: list[dict],
    by_profession: dict[str, dict],
    total_employees: int,
    saudi_count: int,
) -> dict[str, Any]:
    """
    Compare targeted professions from one or more decisions against GOSI data.

    Args:
        targeted_professions: Combined list of {name, target_percentage, min_employees, notes, decision_number?}.
        by_profession: {title: {total, saudi, pct}} from GOSI summary.
        total_employees: Total headcount from GOSI.
        saudi_count: Total Saudi employees from GOSI.

    Returns rich dict with active_sectors, future_sectors, counts and legacy profession_gaps list.
    """
    current_pct = round((saudi_count / total_employees * 100), 2) if total_employees > 0 else 0.0

    matched_gosi_keys: set[str] = set()
    active_sectors: list[dict] = []
    future_sectors: list[dict] = []

    for prof in targeted_professions:
        name = prof.get("name", "")
        target_pct_val = float(prof.get("target_percentage") or 0)
        min_employees = int(prof.get("min_employees") or 5)

        gosi_key, matched_stats = _find_profession_with_key(name, by_profession)
        if gosi_key:
            matched_gosi_keys.add(gosi_key)

        if matched_stats:
            p_total = matched_stats["total"]
            p_saudi = matched_stats["saudi"]
            p_pct = matched_stats["pct"]
        else:
            p_total = 0
            p_saudi = 0
            p_pct = 0.0

        if p_total == 0:
            future_sectors.append({
                "profession": name,
                "decision_number": prof.get("decision_number"),
                "target_pct": target_pct_val,
                "min_employees": min_employees,
                "notes": prof.get("notes"),
            })
        else:
            if p_total < min_employees:
                status = "below_limit"
            elif p_pct >= target_pct_val:
                status = "compliant"
            else:
                status = "violation"

            needed = 0
            if target_pct_val > 0 and p_total >= min_employees and status == "violation":
                required_saudi = int((target_pct_val / 100) * p_total)
                needed = max(0, required_saudi - p_saudi)

            active_sectors.append({
                "profession": name,
                "decision_number": prof.get("decision_number"),
                "status": status,
                "current_count": p_total,
                "current_saudi": p_saudi,
                "current_non_saudi": p_total - p_saudi,
                "current_pct": p_pct,
                "target_pct": target_pct_val,
                "min_employees": min_employees,
                "gap_pct": round(target_pct_val - p_pct, 2),
                "needed": needed,
                "notes": prof.get("notes"),
            })

    # Unclassified GOSI employees (not matching any decision profession)
    unclassified_total = 0
    unclassified_saudi = 0
    for key, stats in by_profession.items():
        if key not in matched_gosi_keys:
            unclassified_total += stats["total"]
            unclassified_saudi += stats["saudi"]

    compliant_count = sum(1 for s in active_sectors if s["status"] == "compliant")
    violation_count = sum(1 for s in active_sectors if s["status"] == "violation")
    below_limit_count = sum(1 for s in active_sectors if s["status"] == "below_limit")

    target_pcts = [float(p.get("target_percentage") or 0) for p in targeted_professions if p.get("target_percentage")]
    overall_target = round(sum(target_pcts) / len(target_pcts), 2) if target_pcts else 0.0

    # Legacy flat list for backward compatibility
    profession_gaps = [
        {
            "profession": s["profession"],
            "decision_number": s.get("decision_number"),
            "current_count": s["current_count"],
            "current_saudi": s["current_saudi"],
            "current_pct": s["current_pct"],
            "target_pct": s["target_pct"],
            "gap_pct": s["gap_pct"],
            "needed": s["needed"],
            "status": s["status"],
            "notes": s.get("notes"),
        }
        for s in active_sectors
    ]

    return {
        "current_pct": current_pct,
        "target_pct": overall_target,
        "gap_pct": round(overall_target - current_pct, 2),
        "active_sectors": active_sectors,
        "future_sectors": future_sectors,
        "profession_gaps": profession_gaps,
        "compliant_count": compliant_count,
        "violation_count": violation_count,
        "below_limit_count": below_limit_count,
        "active_sector_count": len(active_sectors),
        "unclassified_total": unclassified_total,
        "unclassified_saudi": unclassified_saudi,
    }


def _find_profession_with_key(name: str, by_profession: dict[str, dict]) -> tuple[str | None, dict | None]:
    name_lower = name.strip().lower()
    for key, val in by_profession.items():
        if key.strip().lower() == name_lower:
            return key, val
    for key, val in by_profession.items():
        if name_lower in key.strip().lower() or key.strip().lower() in name_lower:
            return key, val
    return None, None
