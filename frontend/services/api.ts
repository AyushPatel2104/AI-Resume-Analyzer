import type {
  AnalysisDetail,
  AnalysisSummary,
  AnalyzeResponse,
  ApiError,
} from "@/types/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_PREFIX = "/api/v1";

function apiUrl(path: string): string {
  return `${API_BASE}${API_PREFIX}${path}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiError;
    if (typeof body.detail === "string") return body.detail;
  } catch {
    /* ignore */
  }
  return `Request failed (${response.status})`;
}

export async function analyzeResume(file: File, jobDescription: string): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("resume", file);
  form.append("job_description", jobDescription);

  const response = await fetch(apiUrl("/analyze"), {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AnalyzeResponse;
}

export async function fetchAnalysisHistory(limit = 10): Promise<AnalysisSummary[]> {
  const response = await fetch(apiUrl(`/analyze/history?limit=${limit}`), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as AnalysisSummary[];
}

export async function fetchAnalysisById(id: string): Promise<AnalysisDetail> {
  const response = await fetch(apiUrl(`/analyze/${id}`), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as AnalysisDetail;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/health"), { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
