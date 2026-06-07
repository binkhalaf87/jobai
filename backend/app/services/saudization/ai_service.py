"""Generate Arabic AI recommendations for Saudization gap analysis using GPT."""

from __future__ import annotations

import logging
from typing import Any

from app.core.openai_client import get_openai_client

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
أنت مستشار متخصص في التوطين وسوق العمل السعودي. بناءً على بيانات قرار التوطين وتقرير التأمينات الاجتماعية المقدمة، أعطِ توصيات عملية ومحددة.

قدّم تحليلاً شاملاً يتضمن:
1. **الوضع الحالي** - ملخص موجز للوضع الراهن
2. **أبرز الفجوات** - المهن التي تحتاج أكبر تحسين
3. **خطة العمل** - خطوات عملية للوصول للنسب المستهدفة
4. **توصيات التوظيف** - المهارات والمؤهلات المطلوبة
5. **تحذيرات** - مخاطر عدم الامتثال إن وجدت

اكتب بالعربية، واجعل التوصيات قابلة للتطبيق ومحددة بأرقام.
"""


def generate_recommendations(
    decision_title: str | None,
    decision_number: str | None,
    current_pct: float,
    target_pct: float,
    gap_pct: float,
    profession_gaps: list[dict],
    total_employees: int,
    saudi_count: int,
) -> str:
    """Generate Arabic AI recommendations for saudization improvement."""
    client = get_openai_client()

    # Build a structured summary for the prompt
    professions_text = ""
    for p in profession_gaps:
        professions_text += (
            f"- {p['profession']}: "
            f"الحالي {p['current_pct']:.1f}% ({p['current_saudi']} من {p['current_count']}) "
            f"/ الهدف {p['target_pct']:.1f}% / الفجوة {p['gap_pct']:.1f}% / "
            f"يحتاج {p['needed']} موظف سعودي إضافي\n"
        )

    user_message = f"""
بيانات التحليل:

**القرار:** {decision_title or 'غير محدد'} (رقم: {decision_number or 'غير محدد'})

**الإحصاءات الإجمالية:**
- إجمالي الموظفين: {total_employees}
- الموظفون السعوديون: {saudi_count}
- نسبة التوطين الحالية: {current_pct:.1f}%
- النسبة المستهدفة: {target_pct:.1f}%
- الفجوة: {gap_pct:.1f}%

**تفاصيل المهن المستهدفة:**
{professions_text or 'لا توجد مهن محددة في القرار'}

قدّم توصياتك التفصيلية.
"""

    response = get_openai_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=2000,
        temperature=0.4,
    )

    return response.choices[0].message.content or ""
