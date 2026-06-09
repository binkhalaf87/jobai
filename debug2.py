"""Check all AI reports for the user."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__) + "/backend")
os.chdir(os.path.dirname(__file__) + "/backend")

import psycopg
db = os.environ["DATABASE_URL"].replace("postgresql+psycopg://", "postgresql://")
with psycopg.connect(db) as conn:
    with conn.cursor() as c:
        c.execute("""
            SELECT r.status, r.created_at, r.report_type, r.resume_id,
                   LEFT(r.report_text, 50) as preview
            FROM ai_analysis_reports r
            JOIN users u ON u.id = r.user_id
            WHERE u.email = 'asamh121p@gmail.com'
            ORDER BY r.created_at DESC
        """)
        rows = c.fetchall()
        print(f"Reports for asamh121p@gmail.com ({len(rows)} total):")
        for r in rows:
            print(f"  status={r[0]} | type={r[2]} | {r[1]} | preview={r[4]}")

        # Also check credits detail
        c.execute("""
            SELECT feature, quantity_granted, quantity_used,
                   (quantity_granted - quantity_used) as available, created_at
            FROM user_feature_credits
            WHERE user_id = (SELECT id FROM users WHERE email = 'asamh121p@gmail.com')
        """)
        rows = c.fetchall()
        print("\nCredit details:")
        for r in rows:
            print(f"  {r[0]} | granted={r[1]} used={r[2]} available={r[3]} | {r[4]}")
