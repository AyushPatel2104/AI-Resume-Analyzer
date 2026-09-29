"""Application pipeline statuses — centralized enum and transition rules."""

from enum import Enum


class ApplicationStatus(str, Enum):
    SAVED = "SAVED"
    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


APPLICATION_STATUS_VALUES: frozenset[str] = frozenset(s.value for s in ApplicationStatus)

DEFAULT_APPLICATION_STATUS = ApplicationStatus.SAVED

# Documented: any valid status may move to any other valid status (user-driven pipeline).
# Terminal states (REJECTED, WITHDRAWN) may still be reopened to SAVED/APPLIED if the user corrects data.


def parse_application_status(raw: str) -> ApplicationStatus:
    upper = (raw or "").strip().upper()
    if upper not in APPLICATION_STATUS_VALUES:
        raise ValueError(f"Invalid application status: {raw}")
    return ApplicationStatus(upper)


class ApplicationSource(str, Enum):
    LINKEDIN = "LINKEDIN"
    COMPANY_WEBSITE = "COMPANY_WEBSITE"
    INDEED = "INDEED"
    REFERRAL = "REFERRAL"
    UNIVERSITY = "UNIVERSITY"
    OTHER = "OTHER"


APPLICATION_SOURCE_VALUES: frozenset[str] = frozenset(s.value for s in ApplicationSource)


def parse_application_source(raw: str | None) -> ApplicationSource | None:
    if raw is None or not str(raw).strip():
        return None
    upper = str(raw).strip().upper()
    if upper not in APPLICATION_SOURCE_VALUES:
        raise ValueError(f"Invalid application source: {raw}")
    return ApplicationSource(upper)
