import io
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader

from app.config import Settings


class ResumeParseError(Exception):
    pass


def extract_text_from_pdf(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as exc:
        raise ResumeParseError("Unable to read PDF file.") from exc

    parts: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text()
            if text:
                parts.append(text)
        except Exception:
            continue

    text = "\n".join(parts).strip()
    if not text:
        raise ResumeParseError("PDF contains no extractable text (scanned images are not supported).")
    return text


def extract_text_from_docx(data: bytes) -> str:
    try:
        doc = Document(io.BytesIO(data))
    except Exception as exc:
        raise ResumeParseError("Unable to read DOCX file.") from exc

    parts = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
    text = "\n".join(parts).strip()
    if not text:
        raise ResumeParseError("DOCX file appears empty.")
    return text


def parse_resume_bytes(filename: str, data: bytes, settings: Settings) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in settings.allowed_extension_set:
        raise ResumeParseError(f"Unsupported file type '{ext}'. Allowed: {settings.allowed_extensions}")

    if len(data) > settings.max_upload_bytes:
        max_mb = settings.max_upload_bytes / (1024 * 1024)
        raise ResumeParseError(f"File exceeds maximum size of {max_mb:.0f} MB.")

    if ext == ".pdf":
        return extract_text_from_pdf(data)
    if ext == ".docx":
        return extract_text_from_docx(data)

    raise ResumeParseError(f"Unsupported file type '{ext}'.")


def normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
