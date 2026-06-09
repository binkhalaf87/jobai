"""Test OpenAI streaming call directly."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__) + "/backend")
os.chdir(os.path.dirname(__file__) + "/backend")

from app.core.openai_client import get_openai_client
from app.services.ai_report_service import (
    _get_system_prompt, build_user_message, get_rewrite_model_name,
    AI_REPORT_TEMPERATURE, AI_REPORT_MAX_TOKENS
)

# Get resume text for asamh121p@gmail.com
import psycopg
db_url = os.environ["DATABASE_URL"].replace("postgresql+psycopg://", "postgresql://")
with psycopg.connect(db_url) as conn:
    with conn.cursor() as c:
        c.execute("""
            SELECT r.raw_text FROM resumes r
            JOIN users u ON u.id = r.user_id
            WHERE u.email = 'asamh121p@gmail.com'
            LIMIT 1
        """)
        row = c.fetchone()
        resume_text = row[0] if row else None

if not resume_text:
    print("ERROR: No resume found")
    sys.exit(1)

print(f"Resume text length: {len(resume_text)} chars")
print(f"Model: {get_rewrite_model_name()}")

client = get_openai_client()
try:
    stream = client.chat.completions.create(
        model=get_rewrite_model_name(),
        messages=[
            {"role": "system", "content": _get_system_prompt("analysis")},
            {"role": "user", "content": build_user_message(resume_text, None, language="Arabic")},
        ],
        stream=True,
        temperature=AI_REPORT_TEMPERATURE,
        max_tokens=AI_REPORT_MAX_TOKENS,
    )
    chars = 0
    for chunk in stream:
        content = chunk.choices[0].delta.content or ""
        chars += len(content)
        if chars < 200:
            print(content, end="", flush=True)
        elif chars == len(content) + (chars - len(content)):
            pass
    print(f"\n\nSUCCESS: streamed {chars} chars total")
except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {e}")
