import re
from html import unescape

from bs4 import BeautifulSoup


def _clean_text(text: str) -> str:
    text = unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_job_from_html(html: str, source_url: str) -> dict[str, str | None]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    title = None
    for selector, attr in [
        ("meta[property='og:title']", "content"),
        ("meta[name='twitter:title']", "content"),
        ("title", None),
        ("h1", None),
    ]:
        if attr:
            node = soup.select_one(selector)
            if node and node.get(attr):
                title = _clean_text(node[attr])
                break
        else:
            node = soup.find(selector.split()[0])
            if node and node.get_text(strip=True):
                title = _clean_text(node.get_text(" ", strip=True))
                break

    company = None
    for selector, attr in [
        ("meta[property='og:site_name']", "content"),
        ("meta[name='application-name']", "content"),
    ]:
        node = soup.select_one(selector)
        if node and node.get(attr):
            company = _clean_text(node[attr])
            break

    description = None
    for selector, attr in [
        ("meta[property='og:description']", "content"),
        ("meta[name='description']", "content"),
    ]:
        node = soup.select_one(selector)
        if node and node.get(attr):
            description = _clean_text(node[attr])
            break

    if not description or len(description) < 80:
        candidates: list[str] = []
        for node in soup.select("article, main, [role='main'], .job-description, #job-description, .description"):
            chunk = _clean_text(node.get_text("\n", strip=True))
            if len(chunk) >= 80:
                candidates.append(chunk)
        if not candidates:
            body = soup.find("body")
            if body:
                chunk = _clean_text(body.get_text("\n", strip=True))
                if len(chunk) >= 80:
                    candidates.append(chunk)
        if candidates:
            description = max(candidates, key=len)

    if not title and description:
        first_line = next((ln.strip() for ln in description.splitlines() if ln.strip()), "")
        title = first_line[:512] if first_line else None

    return {
        "title": title,
        "company_name": company,
        "job_description": description,
        "source_url": source_url,
    }
