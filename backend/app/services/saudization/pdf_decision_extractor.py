"""Extract Saudization decision data from PDF files using GPT-4o Vision."""

from __future__ import annotations

import base64
import json
import logging
from pathlib import Path
from typing import Any

import fitz

from app.core.openai_client import get_openai_client

logger = logging.getLogger(__name__)

_VISION_ZOOM = 2.0   # higher zoom = more detail for dense Arabic text
_MAX_PAGES = 10      # read up to 10 pages — decisions can be multi-page

_SYSTEM_PROMPT = """\
أنت محلل قانوني ومتخصص في قرارات التوطين السعودية الرسمية الصادرة عن وزارة الموارد البشرية والتنمية الاجتماعية (نظام نطاقات). مهمتك استخراج كل المعلومات الواردة في القرار باستكمال تام وصرامة.

**قاعدة صارمة:** لا تترك أي حقل فارغاً أو null إذا كانت المعلومة موجودة في الوثيقة ولو بشكل غير مباشر. اقرأ الوثيقة كاملة من أول صفحة لآخر صفحة. إذا وردت معلومة في أي مكان في الوثيقة فاستخرجها.

أعد JSON فقط بالهيكل التالي (بدون أي نص إضافي أو markdown):

{
  "decision_number": "رقم القرار الرسمي كما ورد حرفياً، أو null إذا لم يُذكر",
  "decision_date": "تاريخ القرار كما ورد حرفياً، أو null",
  "decision_title": "العنوان الرسمي الكامل للقرار، أو null",
  "issuing_authority": "اسم الجهة أو الوزارة المُصدِرة بالكامل، أو null",
  "decision_definition": "وصف شامل ومفصّل لما يُلزم به هذا القرار: ماذا يشترط، على من يطبّق، ما هو الهدف منه، وأي تفاصيل تنفيذية أخرى. لا تختصر — اكتب كل ما ورد في القرار.",
  "targeted_professions": [
    {
      "name": "اسم المهنة أو النشاط أو القطاع كما ورد في القرار",
      "target_percentage": 35.0,
      "min_employees": 5,
      "min_salary": 4000,
      "calculation_method": "وصف دقيق لطريقة احتساب نسبة التوطين لهذه المهنة كما نص عليها القرار",
      "notes": "أي استثناءات أو شروط خاصة أو ملاحظات تخص هذه المهنة"
    }
  ],
  "general_notes": "أي أحكام عامة، استثناءات، عقوبات، جداول زمنية للتطبيق، أو معلومات أخرى وردت في القرار",
  "raw_text": "النص الكامل المستخرج من جميع صفحات الوثيقة"
}

**تعليمات تفصيلية لكل حقل:**

decision_number: ابحث عن "رقم القرار" أو "قرار رقم" أو "م/..." أو "و.م/..." أو تسلسل رقمي رسمي.

decision_date: أي تاريخ مرتبط بإصدار القرار (هجري أو ميلادي).

decision_title: العنوان الرسمي الكامل كما هو مكتوب في الوثيقة.

issuing_authority: اسم الوزارة أو الجهة الحكومية بالكامل.

decision_definition: هذا الحقل بالغ الأهمية — اكتب فيه شرحاً وافياً للقرار يشمل:
  - ما الذي يُلزم به القرار
  - من هم المخاطبون به (أصحاب العمل، المنشآت، القطاعات)
  - متى يبدأ التطبيق
  - الهدف العام من القرار
  - أي تفاصيل تنفيذية

targeted_professions: استخرج كل مهنة أو نشاط أو قطاع يذكره القرار مع نسبة توطين:
  - name: الاسم الدقيق كما ورد في الجدول أو النص
  - target_percentage: رقم عشري (0–100). إذا كانت النسبة "35%" اكتب 35.0
  - min_employees: الحد الأدنى لعدد الموظفين الذي تسري عليه النسبة (إذا لم يُذكر اكتب 1)
  - min_salary: الراتب الأدنى بالريال السعودي إذا ذُكر (إذا لم يُذكر اكتب null)
  - calculation_method: كيف تُحتسب هذه النسبة — مثلاً "من إجمالي العاملين في هذه المهنة" أو "من قوة العمل الكلية في المنشأة" أو "من العمالة المسجلة في التأمينات". استخرج النص الحرفي من القرار.
  - notes: أي استثناءات أو مهل زمنية أو شروط خاصة

general_notes: كل ما لم يندرج تحت مهنة محددة — العقوبات، مهل التطبيق، الاستثناءات العامة.

raw_text: النص الكامل لجميع الصفحات مدمجاً.

**تحذيرات:**
- لا تخترع معلومات غير موجودة في الوثيقة.
- لا تضع null إذا كانت المعلومة موجودة ولو ضمنياً.
- targeted_professions يجب أن تكون قائمة وليس فارغة إذا ذُكرت أي مهن.
- min_employees الافتراضي 1 (وليس 5) إذا لم يُذكر في القرار.
- أعد JSON فقط، لا شيء آخر.
"""


def _render_pages(file_path: Path) -> list[str]:
    images: list[str] = []
    with fitz.open(str(file_path)) as doc:
        for page in list(doc)[:_MAX_PAGES]:
            mat = fitz.Matrix(_VISION_ZOOM, _VISION_ZOOM)
            pix = page.get_pixmap(matrix=mat)
            images.append(base64.b64encode(pix.tobytes("png")).decode())
    return images


def extract_decision_from_pdf(file_path: Path) -> dict[str, Any]:
    """Extract all structured decision data from a Saudization PDF using GPT-4o Vision."""
    images = _render_pages(file_path)
    if not images:
        raise ValueError("Could not render any pages from the PDF file.")

    client = get_openai_client()

    content: list[dict] = [{
        "type": "text",
        "text": (
            f"الوثيقة مكوّنة من {len(images)} صفحة. "
            "استخرج جميع المعلومات الواردة فيها بالكامل وفق التعليمات. "
            "اقرأ كل صفحة بعناية ولا تتجاهل أي جدول أو نص:"
        ),
    }]
    for img_b64 in images:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{img_b64}", "detail": "high"},
        })

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": content},
        ],
        max_tokens=6000,
        temperature=0.0,   # deterministic for consistent extraction
    )

    raw = (response.choices[0].message.content or "").strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("GPT returned non-JSON for decision extraction; wrapping raw text.")
        return {
            "decision_number": None,
            "decision_date": None,
            "decision_title": None,
            "issuing_authority": None,
            "decision_definition": None,
            "targeted_professions": [],
            "general_notes": None,
            "raw_text": raw,
        }

    # Normalize: ensure min_employees default is 1 (not 5) when absent
    for prof in result.get("targeted_professions") or []:
        if prof.get("min_employees") is None:
            prof["min_employees"] = 1

    return result
