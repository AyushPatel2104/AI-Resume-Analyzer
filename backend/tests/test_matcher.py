from app.schemas import ParsedProfile
from app.services.matcher import compute_match


def test_compute_match_with_skills():
    profile = ParsedProfile(
        name="Jane Doe",
        skills=["Python", "FastAPI", "React"],
        raw_text_preview="Python FastAPI React developer",
    )
    jd = "Looking for Python and FastAPI experience with React frontend skills."
    result = compute_match(profile.raw_text_preview, profile, jd)
    assert 0 <= result.overall_score <= 100
    assert "python" in {s.lower() for s in result.matched_skills} or result.skill_coverage > 0


def test_compute_match_empty_jd_skills_still_semantic():
    profile = ParsedProfile(name="A", skills=[], raw_text_preview="software engineer building web apps")
    jd = "We need a software engineer to build modern web applications with strong communication."
    result = compute_match(profile.raw_text_preview, profile, jd)
    assert result.overall_score >= 0
