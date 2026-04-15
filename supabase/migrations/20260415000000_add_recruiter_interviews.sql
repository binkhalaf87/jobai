-- Add recruiter_interviews table for AI-generated interview question sets
-- linked to a specific candidate resume + job description combination.

CREATE TABLE IF NOT EXISTS recruiter_interviews (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID       NOT NULL REFERENCES users(id)             ON DELETE CASCADE,
    resume_id    UUID       NOT NULL REFERENCES resumes(id)           ON DELETE CASCADE,
    job_id       UUID       NOT NULL REFERENCES job_descriptions(id)  ON DELETE CASCADE,

    interview_type  TEXT    NOT NULL DEFAULT 'mixed',   -- hr | technical | mixed
    language        TEXT    NOT NULL DEFAULT 'en',      -- en | ar

    -- {candidate_summary, focus_areas, questions: [{index, question, type, focus_area}]}
    generated_questions JSONB,

    status      TEXT        NOT NULL DEFAULT 'ready',   -- generating | ready | failed

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_recruiter_interviews_recruiter_id ON recruiter_interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS ix_recruiter_interviews_resume_id    ON recruiter_interviews(resume_id);
CREATE INDEX IF NOT EXISTS ix_recruiter_interviews_job_id       ON recruiter_interviews(job_id);
