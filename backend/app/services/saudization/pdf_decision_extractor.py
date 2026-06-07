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

_VISION_ZOOM = 1.5
_MAX_PAGES = 6

_SYSTEM_PROMPT = """\
أنت متخصص في تحليل وثائق قرارات التوطين السعودية الرسمية. استخرج المعلومات التالية من القرار وأعد JSON فقط بالشكل التالي:

{
  "decision_number": "رقم القرار أو null",
  "decision_date": "تاريخ القرار بصيغة نصية أو null",
  "decision_title": "عنوان أو موضوع القرار أو null",
  "issuing_authority": "الجهة المُصدِرة للقرار أو null",
  "targeted_professions": [
    {
      "name": "اسم المهنة",
      "target_percentage": 0.0,
      "notes": "ملاحظات إضافية أو null"
    }
  ],
  "raw_text": "النص الكامل المستخرج من الوثيقة"
}

قواعد:
- targeted_professions: قائمة بجميع المهن المذكورة مع نسبة التوطين المطلوبة (رقم عشري من 0 إلى 100).
- إذا لم تجد نسبة محددة، ضع 0.
- raw_text: كامل النص المقروء من الوثيقة.
- أعد JSON فقط بدون أي نص إضافي أو markdown.
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
    """Extract structured decision data from a Saudization PDF using GPT-4o Vision."""
    images = _render_pages(file_path)
    if not images:
        raise ValueError("Could not render any pages from the PDF file.")

    client = get_openai_client()

    content: list[dict] = [{"type": "text", "text": "استخرج بيانات قرار التوطين من هذه الوثيقة:"}]
    for img_b64 in images:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{img_b64}", "detail": "high"},
        })

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        max_tokens=4000,
        temperature=0.1,
    )

    raw = response.choices[0].message.content or ""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("GPT returned non-JSON for decision extraction, wrapping raw text.")
        return {
            "decision_number": None,
            "decision_date": None,
            "decision_title": None,
            "issuing_authority": None,
            "targeted_professions": [],
            "raw_text": raw,
        }
