import pytest

from app.config import Settings
from app.schemas import ParsedProfile
from app.services.matching.engine import compute_match_v2
from app.services.matching.skill_normalization import normalize_token
from app.services.matching.semantic_similarity import compute_semantic_signal
from app.services.job_normalization import normalize_job_requirements


def _settings() -> Settings:
    return Settings(semantic_model_enabled=False)


def _profile(**kwargs) -> ParsedProfile:
    return ParsedProfile(**kwargs)


def _normalized(jd: str, **extra) -> dict:
    base = normalize_job_requirements(jd)
    base.update(extra)
    return base


def test_required_skill_match():
    profile = _profile(skills=["Python", "FastAPI"], raw_text_preview="Python FastAPI developer")
    jd = "Required: Python, FastAPI, PostgreSQL for backend services."
    norm = _normalized(jd, required_skills=["python", "fastapi", "postgresql"])
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), norm)
    assert "Python" in result.matched_required_skills
    assert result.components and result.components.required_coverage >= 0


def test_required_skill_missing():
    profile = _profile(skills=["Python"], raw_text_preview="Python only")
    jd = "Must have Python and Kubernetes experience."
    norm = _normalized(jd, required_skills=["python", "kubernetes"])
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), norm)
    assert any("Kubernetes" in s for s in result.missing_required_skills)


def test_preferred_skill_match_and_missing():
    profile = _profile(skills=["Python", "Docker"], raw_text_preview="Python Docker")
    norm = {"required_skills": ["python"], "preferred_skills": ["react", "docker"], "jd_skills_detected": ["python", "docker", "react"]}
    jd = "Python required. Preferred React and Docker."
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), norm)
    assert "Docker" in result.matched_preferred_skills
    assert "React" in result.missing_preferred_skills


def test_skill_normalization_aliases():
    assert normalize_token("ReactJS") == "react"
    assert normalize_token("Postgres") == "postgresql"


def test_semantic_fallback_when_unavailable():
    settings = Settings(semantic_model_enabled=False)
    sem, text, method = compute_semantic_signal("python api developer", "python api role", settings)
    assert sem is None
    assert method == "text_similarity_only"
    assert 0 <= text <= 100


def test_semantic_signal_when_enabled_is_mocked(monkeypatch):
    settings = Settings(semantic_model_enabled=True)

    class FakeModel:
        def encode(self, texts, normalize_embeddings=True):
            return [[1.0, 0.0], [1.0, 0.0]]

    monkeypatch.setattr("app.services.matching.semantic_similarity._load_sentence_model", lambda _name: FakeModel())
    sem, text, method = compute_semantic_signal("python", "python", settings)
    assert sem == 100.0
    assert method == "sentence_transformer"


def test_experience_relevance():
    profile = _profile(
        skills=["Python"],
        experience=[{"title": "Backend Engineer", "company": "Corp", "description": "Built FastAPI services"}],
        raw_text_preview="FastAPI",
    )
    jd = "Need Python and FastAPI experience."
    norm = _normalized(jd, required_skills=["python", "fastapi"])
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), norm)
    assert result.relevant_experience
    assert result.components and result.components.experience_available


def test_unknown_experience_not_fabricated():
    profile = _profile(skills=["Python"], raw_text_preview="Python", experience=[])
    jd = "Python developer role."
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), _normalized(jd))
    assert result.components
    assert result.components.experience_available is False
    assert result.components.experience_score is None


def test_education_requirement_present():
    profile = _profile(
        education=[{"degree": "Bachelor of Science", "institution": "State U"}],
        raw_text_preview="BS graduate",
    )
    norm = {"education_requirements": ["bachelor"], "jd_skills_detected": []}
    jd = "Bachelor degree required."
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), norm)
    assert result.components and result.components.education_requirement_specified
    assert result.components.education_score is not None


def test_education_requirement_absent_not_fake_perfect():
    profile = _profile(education=[], raw_text_preview="engineer")
    jd = "Software engineer."
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), _normalized(jd))
    assert result.components
    assert result.components.education_requirement_specified is False
    assert result.components.education_score is None


def test_project_relevance():
    profile = _profile(projects=["Built FastAPI microservices with PostgreSQL"], skills=["Python"], raw_text_preview="")
    norm = {"required_skills": ["fastapi", "postgresql"], "jd_skills_detected": ["fastapi"]}
    jd = "FastAPI and PostgreSQL project experience."
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), norm)
    assert result.relevant_projects


def test_seniority_match():
    profile = _profile(experience=[{"title": "Senior Software Engineer", "company": "X"}], raw_text_preview="")
    norm = {"seniority_level": "senior", "jd_skills_detected": []}
    jd = "Senior software engineer"
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), norm)
    assert result.components and result.components.seniority_available


def test_seniority_unknown():
    profile = _profile(experience=[], raw_text_preview="developer")
    norm = {"seniority_level": None, "jd_skills_detected": []}
    result = compute_match_v2(profile.raw_text_preview, profile, "Developer", _settings(), norm)
    assert result.components and result.components.seniority_available is False


def test_required_vs_preferred_coverage():
    profile = _profile(skills=["Python"], raw_text_preview="Python")
    norm = {"required_skills": ["python", "fastapi"], "preferred_skills": ["docker"], "jd_skills_detected": ["python", "fastapi", "docker"]}
    result = compute_match_v2(profile.raw_text_preview, profile, "Python FastAPI Docker", _settings(), norm)
    assert result.components
    assert result.components.required_coverage < 100
    assert result.components.preferred_coverage <= 100


def test_keyword_coverage():
    profile = _profile(skills=["Python", "PostgreSQL", "Docker"], technologies=["AWS"], raw_text_preview="")
    norm = {
        "programming_languages": ["python"],
        "databases": ["postgresql"],
        "tools": ["docker"],
        "cloud_platforms": ["aws"],
        "jd_skills_detected": ["python"],
    }
    result = compute_match_v2(profile.raw_text_preview, profile, "Python PostgreSQL Docker AWS", _settings(), norm)
    assert result.components and result.components.keyword_score > 0


def test_explainable_strengths_and_gaps():
    profile = _profile(skills=["Python"], raw_text_preview="Python developer")
    norm = {"required_skills": ["python", "kubernetes"], "jd_skills_detected": ["python", "kubernetes"]}
    result = compute_match_v2(profile.raw_text_preview, profile, "Python and Kubernetes required", _settings(), norm)
    assert result.strengths
    assert result.weaknesses


def test_gap_severity_classification():
    profile = _profile(skills=["Python"], raw_text_preview="Python")
    norm = {"required_skills": ["kubernetes"], "preferred_skills": ["react"], "jd_skills_detected": ["kubernetes", "react"]}
    result = compute_match_v2(profile.raw_text_preview, profile, "Kubernetes required, React preferred", _settings(), norm)
    severities = {g.severity for g in result.skill_gaps}
    assert "critical" in severities
    assert "optional" in severities


def test_overall_score_range():
    profile = _profile(skills=["Python", "FastAPI", "React"], raw_text_preview="Python FastAPI React PostgreSQL Docker")
    jd = "Python FastAPI React PostgreSQL Docker backend engineer with 5+ years experience. Bachelor degree. Senior role."
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), normalize_job_requirements(jd))
    assert 0 <= result.overall_score <= 100


def test_missing_signals_do_not_become_perfect():
    profile = _profile(raw_text_preview="", skills=[], experience=[], education=[], projects=[])
    jd = "Role without explicit structured requirements."
    result = compute_match_v2(profile.raw_text_preview, profile, jd, _settings(), {"jd_skills_detected": []})
    assert result.overall_score <= 100
    assert result.components
    assert result.components.experience_score is None
