import json

import httpx

from app.config import Settings
from app.schemas import MatchResult, ParsedProfile


async def maybe_enhance_recommendations(
    settings: Settings,
    profile: ParsedProfile,
    job_description: str,
    match: MatchResult,
) -> MatchResult:
    if not settings.openai_api_key:
        return match

    prompt = {
        "role": "You are a career coach. Given resume profile JSON, job description, and baseline match analysis, "
        "return 3-5 concise, actionable recommendations. Do not invent credentials. Respond as JSON: "
        '{"recommendations": ["..."]}',
        "profile": profile.model_dump(),
        "job_description": job_description[:4000],
        "baseline": match.model_dump(),
    }

    base_url = (settings.openai_base_url or "https://api.openai.com/v1").rstrip("/")
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    body = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": "Respond with valid JSON only."},
            {"role": "user", "content": json.dumps(prompt)},
        ],
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=body)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            recs = parsed.get("recommendations")
            if isinstance(recs, list) and all(isinstance(r, str) for r in recs):
                match.recommendations = recs[:6]
    except Exception:
        pass

    return match
