"""Debug script: check resume raw_text for users."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__) + "/backend")
os.chdir(os.path.dirname(__file__) + "/backend")

import psycopg
db = os.environ["DATABASE_URL"].replace("postgresql+psycopg://", "postgresql://")
with psycopg.connect(db) as conn:
    with conn.cursor() as c:
        # Check resumes with null/empty raw_text
        c.execute("""
            SELECT u.email, r.id, r.source_filename, r.title,
                   CASE WHEN r.raw_text IS NULL THEN 'NULL'
                        WHEN r.raw_text = '' THEN 'EMPTY'
                        ELSE 'OK (' || length(r.raw_text) || ' chars)'
                   END as raw_text_status
            FROM resumes r
            JOIN users u ON u.id = r.user_id
            ORDER BY r.created_at DESC
            LIMIT 20
        """)
        rows = c.fetchall()
        print("Recent resumes:")
        for r in rows:
            print(f"  {r[0]} | {r[2] or r[3]} | raw_text: {r[4]}")

        # Check feature credits
        c.execute("""
            SELECT u.email, ufc.feature,
                   SUM(ufc.quantity_granted - ufc.quantity_used) as balance
            FROM user_feature_credits ufc
            JOIN users u ON u.id = ufc.user_id
            GROUP BY u.email, ufc.feature
            ORDER BY u.email, ufc.feature
        """)
        rows = c.fetchall()
        print("\nFeature credit balances:")
        for r in rows:
            print(f"  {r[0]} | {r[1]} | balance: {r[2]}")

        # Check failed reports
        c.execute("""
            SELECT u.email, r.id, r.status, r.created_at, r.resume_id
            FROM ai_analysis_reports r
            JOIN users u ON u.id = r.user_id
            WHERE r.status = 'failed'
            ORDER BY r.created_at DESC
            LIMIT 10
        """)
        rows = c.fetchall()
        print("\nFailed AI reports:")
        for r in rows:
            print(f"  {r[0]} | {r[1]} | {r[3]}")
