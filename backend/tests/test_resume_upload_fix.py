"""Unit tests for the recruiter resume upload fix.

Verifies that save_resume_upload uses the caller's DB session for text
extraction (via _apply_resume_text) instead of opening a new session via
process_resume_text_task, which would fail before the row is committed.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.enums import ResumeProcessingStatus
from app.models.resume import Resume


@pytest.fixture()
def mock_resume() -> Resume:
    resume = MagicMock(spec=Resume)
    resume.id = "test-resume-id"
    resume.storage_key = "test-resume-id.pdf"
    resume.file_type = "pdf"
    resume.processing_status = ResumeProcessingStatus.UPLOADED
    resume.raw_text = None
    resume.normalized_text = None
    return resume


@pytest.mark.asyncio
async def test_save_resume_upload_uses_same_session(mock_resume: Resume) -> None:
    """_apply_resume_text must be called with the existing session, not a new one."""
    mock_db = MagicMock()
    mock_file = AsyncMock()

    with (
        patch("app.services.resume_upload.store_resume", new_callable=AsyncMock, return_value=mock_resume),
        patch("app.services.resume_upload._apply_resume_text") as mock_apply,
    ):
        from app.services.resume_upload import save_resume_upload

        await save_resume_upload(mock_db, MagicMock(), mock_file, auto_commit=False)

        # Must be called with the same db session — not a new SessionLocal()
        mock_apply.assert_called_once()
        call_args = mock_apply.call_args
        assert call_args.args[0] is mock_db, (
            "save_resume_upload must pass the caller's session to _apply_resume_text, "
            "not open a new one"
        )
        assert call_args.args[1] is mock_resume


@pytest.mark.asyncio
async def test_save_resume_upload_sets_parsed_on_success(mock_resume: Resume) -> None:
    """On successful extraction the resume status must be set to PARSED."""
    mock_db = MagicMock()
    mock_file = AsyncMock()

    def fake_apply(db: object, resume: Resume) -> None:
        resume.processing_status = ResumeProcessingStatus.PARSED
        resume.raw_text = "extracted text"
        resume.normalized_text = "normalized text"

    with (
        patch("app.services.resume_upload.store_resume", new_callable=AsyncMock, return_value=mock_resume),
        patch("app.services.resume_upload._apply_resume_text", side_effect=fake_apply),
    ):
        from app.services.resume_upload import save_resume_upload

        result = await save_resume_upload(mock_db, MagicMock(), mock_file, auto_commit=False)

    assert result.processing_status == ResumeProcessingStatus.PARSED
    assert result.raw_text == "extracted text"
    assert result.normalized_text == "normalized text"


@pytest.mark.asyncio
async def test_save_resume_upload_sets_failed_on_extraction_error(mock_resume: Resume) -> None:
    """If _apply_resume_text raises, the resume status must be set to FAILED."""
    mock_db = MagicMock()
    mock_file = AsyncMock()

    with (
        patch("app.services.resume_upload.store_resume", new_callable=AsyncMock, return_value=mock_resume),
        patch("app.services.resume_upload._apply_resume_text", side_effect=RuntimeError("extraction failed")),
    ):
        from app.services.resume_upload import save_resume_upload

        result = await save_resume_upload(mock_db, MagicMock(), mock_file, auto_commit=False)

    assert result.processing_status == ResumeProcessingStatus.FAILED
