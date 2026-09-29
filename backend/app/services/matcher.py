import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas import MatchResult, ParsedProfile
from app.services.skills_catalog import SKILL_CATALOG


def _extract_jd_skills(job_description: str) -> list[str]:
    lower = job_description.lower()
    found: list[str] = []
    for skill in sorted(SKILL_CATALOG, key=len, reverse=True):
        if re.search(r"\b" + re.escape(skill) + r"\b", lower):
            found.append(skill)
    return list(dict.fromkeys(found))


def _semantic_similarity(resume_text: str, job_description: str) -> float:
    corpus = [resume_text, job_description]
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    try:
        matrix = vectorizer.fit_transform(corpus)
    except ValueError:
        return 0.0
    sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    return float(max(0.0, min(1.0, sim)))


def _skill_coverage(resume_skills: set[str], jd_skills: set[str]) -> tuple[float, list[str], list[str]]:
    if not jd_skills:
        return 100.0, sorted(resume_skills), []
    matched = resume_skills & jd_skills
    missing = jd_skills - resume_skills
    coverage = (len(matched) / len(jd_skills)) * 100.0
    return coverage, sorted(matched), sorted(missing)


def _normalize_skill_set(skills: list[str]) -> set[str]:
    return {s.strip().lower() for s in skills if s.strip()}


def _relevant_experience(profile: ParsedProfile, jd_skills: set[str]) -> list[str]:
    snippets: list[str] = []
    for exp in profile.experience[:5]:
        blob = " ".join(filter(None, [exp.title, exp.company, exp.description])).lower()
        if jd_skills and any(skill in blob for skill in jd_skills):
            label = " — ".join(filter(None, [exp.title, exp.company]))
            snippets.append(label or (exp.description or "")[:120])
        elif exp.title:
            snippets.append(" — ".join(filter(None, [exp.title, exp.company])))
    return snippets[:5]


def _rule_recommendations(missing: list[str], profile: ParsedProfile, job_description: str) -> list[str]:
    recs: list[str] = []
    if missing:
        top = ", ".join(s.title() for s in missing[:5])
        recs.append(f"Add or emphasize these job-relevant skills if you have them: {top}.")
    if len(profile.experience) == 0:
        recs.append("Include a dedicated Experience section with role titles, dates, and impact bullets.")
    if len(profile.skills) < 5:
        recs.append("Expand your Skills section with tools and technologies named in the job description.")
    if "years" in job_description.lower() and not re.search(r"\b\d+\+?\s*years?\b", profile.raw_text_preview, re.I):
        recs.append("Mirror the job's experience requirements with clear tenure or years-of-experience statements.")
    if not profile.projects and "project" in job_description.lower():
        recs.append("Highlight 1–2 projects that demonstrate skills required in the job description.")
    recs.append("Quantify outcomes in experience bullets (metrics, scale, or business impact where possible).")
    return recs[:6]


def compute_match(resume_text: str, profile: ParsedProfile, job_description: str) -> MatchResult:
    jd_skills_list = _extract_jd_skills(job_description)
    jd_skills = set(jd_skills_list)
    resume_skills = _normalize_skill_set(profile.skills) | set(_extract_jd_skills(resume_text))

    sem = _semantic_similarity(resume_text, job_description) * 100.0
    coverage_pct, matched, missing = _skill_coverage(resume_skills, jd_skills)

    if jd_skills:
        overall = 0.55 * coverage_pct + 0.45 * sem
    else:
        overall = sem

    overall = round(max(0.0, min(100.0, overall)), 1)
    sem = round(sem, 1)
    coverage_pct = round(coverage_pct, 1)

    strengths: list[str] = []
    if matched:
        strengths.append(f"Strong overlap on {len(matched)} required skills from the job description.")
    if sem >= 60:
        strengths.append("Resume language aligns well with the job description (TF-IDF semantic similarity).")
    if profile.experience:
        strengths.append(f"{len(profile.experience)} experience entries detected for role-context review.")
    if profile.education:
        strengths.append("Education section present and parsed.")

    weaknesses: list[str] = []
    if missing:
        weaknesses.append(f"{len(missing)} job-relevant skills not clearly surfaced on the resume.")
    if sem < 40:
        weaknesses.append("Low textual overlap with the job description; tailor keywords and role-specific phrasing.")
    if not profile.summary:
        weaknesses.append("No summary/profile section detected — consider adding a targeted professional summary.")

    return MatchResult(
        overall_score=overall,
        semantic_similarity=sem,
        skill_coverage=coverage_pct,
        matched_skills=[s.title() for s in matched],
        missing_skills=[s.title() for s in missing],
        strengths=strengths[:5],
        weaknesses=weaknesses[:5],
        relevant_experience=_relevant_experience(profile, jd_skills),
        recommendations=_rule_recommendations(missing, profile, job_description),
        jd_skills_detected=[s.title() for s in jd_skills_list],
    )
