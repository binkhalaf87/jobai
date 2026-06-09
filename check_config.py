import sys, os
sys.path.insert(0, os.path.dirname(__file__) + "/backend")
os.chdir(os.path.dirname(__file__) + "/backend")

from app.core.config import get_settings
from app.services.rewrite_engine import get_rewrite_model_name

s = get_settings()
print("OPENAI_KEY:", "SET" if s.openai_api_key else "MISSING", s.openai_api_key[:12] if s.openai_api_key else "")
print("MODEL:", get_rewrite_model_name())

# Test OpenAI connectivity
from app.core.openai_client import get_openai_client
try:
    client = get_openai_client()
    resp = client.models.list()
    print("OPENAI_CONNECTED: OK")
except Exception as e:
    print(f"OPENAI_CONNECTED: FAILED - {e}")

# Check feature credits
import psycopg
db = os.environ["DATABASE_URL"].replace("postgresql+psycopg://", "postgresql://")
with psycopg.connect(db) as conn:
    with conn.cursor() as c:
        c.execute("""
            SELECT u.email, ufc.feature_name, ufc.remaining_credits
            FROM user_feature_credits ufc
            JOIN users u ON u.id = ufc.user_id
            WHERE ufc.feature_name IN ('resume_analysis', 'resume_improvement')
            ORDER BY u.email, ufc.feature_name
        """)
        rows = c.fetchall()
        if rows:
            print("\nFeature credits:")
            for r in rows:
                print(f"  {r[0]} | {r[1]} | {r[2]}")
        else:
            print("\nNo feature_credits rows found")
