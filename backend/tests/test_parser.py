import pytest

from app.config import Settings
from app.services.parser import ResumeParseError, parse_resume_bytes


def test_rejects_unsupported_extension():
    settings = Settings()
    with pytest.raises(ResumeParseError):
        parse_resume_bytes("resume.txt", b"hello", settings)


def test_rejects_empty_docx():
    settings = Settings()
    with pytest.raises(ResumeParseError):
        parse_resume_bytes("resume.docx", b"", settings)
