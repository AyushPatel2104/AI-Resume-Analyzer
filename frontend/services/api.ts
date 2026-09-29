import type {
  AnalysisDetail,
  AnalysisSummary,
  AnalyzeResponse,
  ApiError,
  ApplicationDetail,
  ApplicationListResponse,
  AuthTokenResponse,
  CareerAskResponse,
  CareerReviewResponse,
  JobDetail,
  JobImportPreview,
  JobSummary,
  LoginRequest,
  RegisterRequest,
  ResumeDetail,
  ResumeIntelligenceResponse,
  ResumeSummary,
  RewriteResponse,
  UserPublic,
} from "@/types/api";
import { authHeaders, clearAuthSession, getClientAccessToken, setAuthSession } from "@/services/auth-session";

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

async function authFetch(path: string, init: RequestInit = {}, accessToken?: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  const auth = authHeaders(accessToken);
  for (const [key, value] of Object.entries(auth)) {
    headers.set(key, value);
  }
  return fetch(apiUrl(path), { ...init, headers });
}

export async function registerUser(payload: RegisterRequest): Promise<AuthTokenResponse> {
  const response = await fetch(apiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as AuthTokenResponse;
  setAuthSession(data.access_token);
  return data;
}

export async function loginUser(payload: LoginRequest): Promise<AuthTokenResponse> {
  const response = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as AuthTokenResponse;
  setAuthSession(data.access_token);
  return data;
}

export async function logoutUser(): Promise<void> {
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } finally {
    clearAuthSession();
  }
}

export async function fetchCurrentUser(accessToken?: string | null): Promise<UserPublic> {
  const response = await authFetch("/auth/me", { cache: "no-store" }, accessToken);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as UserPublic;
}

export async function analyzeWithResumeAndJob(resumeId: string, jobId: string): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("resume_id", resumeId);
  form.append("job_id", jobId);

  const response = await authFetch("/analyze", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AnalyzeResponse;
}

/** Legacy fallback: creates a new saved job from pasted description. */
export async function analyzeWithResumeId(resumeId: string, jobDescription: string): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("resume_id", resumeId);
  form.append("job_description", jobDescription);

  const response = await authFetch("/analyze", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AnalyzeResponse;
}

/** Saves upload to library and runs analysis (legacy one-step flow). */
export async function analyzeResume(file: File, jobDescription: string): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("resume", file);
  form.append("job_description", jobDescription);

  const response = await authFetch("/analyze", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AnalyzeResponse;
}

export async function fetchResumes(accessToken?: string | null): Promise<ResumeSummary[]> {
  const response = await authFetch("/resumes", { cache: "no-store" }, accessToken);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as ResumeSummary[];
}

export async function fetchResumeById(id: string, accessToken?: string | null): Promise<ResumeDetail> {
  const response = await authFetch(`/resumes/${id}`, { cache: "no-store" }, accessToken);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as ResumeDetail;
}

async function postCareer<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await authFetch(`/career-assistant/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as T;
}

export async function careerReview(resumeId: string, jobId?: string): Promise<CareerReviewResponse> {
  return postCareer("review", { resume_id: resumeId, job_id: jobId ?? null });
}

export async function careerRewriteSummary(resumeId: string, jobId?: string): Promise<RewriteResponse> {
  return postCareer("rewrite-summary", { resume_id: resumeId, job_id: jobId ?? null });
}

export async function careerRewriteBullet(
  resumeId: string,
  selectedText: string,
  jobId?: string,
): Promise<RewriteResponse> {
  return postCareer("rewrite-bullet", { resume_id: resumeId, job_id: jobId ?? null, selected_text: selectedText });
}

export async function careerRewriteProject(
  resumeId: string,
  selectedText: string,
  jobId?: string,
): Promise<RewriteResponse> {
  return postCareer("rewrite-project", { resume_id: resumeId, job_id: jobId ?? null, selected_text: selectedText });
}

export async function careerSkills(resumeId: string, jobId?: string): Promise<RewriteResponse> {
  return postCareer("skills", { resume_id: resumeId, job_id: jobId ?? null });
}

export async function careerAsk(resumeId: string, message: string, jobId?: string): Promise<CareerAskResponse> {
  return postCareer("ask", { resume_id: resumeId, job_id: jobId ?? null, message });
}

export async function fetchApplications(params?: {
  status?: string;
  job_id?: string;
  resume_id?: string;
  search?: string;
  sort?: string;
}): Promise<ApplicationListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.job_id) query.set("job_id", params.job_id);
  if (params?.resume_id) query.set("resume_id", params.resume_id);
  if (params?.search) query.set("search", params.search);
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  const response = await authFetch(`/applications${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as ApplicationListResponse;
}

export async function fetchApplicationById(id: string, accessToken?: string | null): Promise<ApplicationDetail> {
  const response = await authFetch(`/applications/${id}`, { cache: "no-store" }, accessToken);
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as ApplicationDetail;
}

export async function createApplication(payload: {
  job_id: string;
  resume_id: string;
  status?: string;
  applied_at?: string;
  follow_up_date?: string;
  notes?: string;
  source?: string;
}): Promise<ApplicationDetail> {
  const response = await authFetch("/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as ApplicationDetail;
}

export async function updateApplication(
  id: string,
  payload: Partial<{
    status: string;
    applied_at: string | null;
    follow_up_date: string | null;
    clear_follow_up_date: boolean;
    notes: string | null;
    source: string | null;
    clear_source: boolean;
  }>,
): Promise<ApplicationDetail> {
  const response = await authFetch(`/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as ApplicationDetail;
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await authFetch(`/applications/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function fetchResumeIntelligence(
  resumeId: string,
  jobId?: string,
  accessToken?: string | null,
): Promise<ResumeIntelligenceResponse> {
  const query = jobId ? `?job_id=${encodeURIComponent(jobId)}` : "";
  const response = await authFetch(`/resumes/${resumeId}/intelligence${query}`, { cache: "no-store" }, accessToken);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as ResumeIntelligenceResponse;
}

export async function uploadResume(file: File, name?: string): Promise<ResumeDetail> {
  const form = new FormData();
  form.append("resume", file);
  if (name?.trim()) {
    form.append("name", name.trim());
  }
  const response = await authFetch("/resumes", { method: "POST", body: form });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as ResumeDetail;
}

export async function renameResume(id: string, name: string): Promise<ResumeDetail> {
  const response = await authFetch(`/resumes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as ResumeDetail;
}

export async function deleteResume(id: string): Promise<void> {
  const response = await authFetch(`/resumes/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function fetchJobs(accessToken?: string | null): Promise<JobSummary[]> {
  const response = await authFetch("/jobs", { cache: "no-store" }, accessToken);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as JobSummary[];
}

export async function fetchJobById(id: string, accessToken?: string | null): Promise<JobDetail> {
  const response = await authFetch(`/jobs/${id}`, { cache: "no-store" }, accessToken);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as JobDetail;
}

export async function previewJobImport(url: string): Promise<JobImportPreview> {
  const response = await authFetch("/jobs/import/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as JobImportPreview;
}

export async function createJob(payload: {
  title: string;
  company_name?: string | null;
  job_description: string;
  source_url?: string | null;
}): Promise<JobDetail> {
  const response = await authFetch("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as JobDetail;
}

export async function updateJob(
  id: string,
  payload: Partial<{ title: string; company_name: string | null; job_description: string; source_url: string | null }>,
): Promise<JobDetail> {
  const response = await authFetch(`/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as JobDetail;
}

export async function deleteJob(id: string): Promise<void> {
  const response = await authFetch(`/jobs/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function fetchAnalysisHistory(limit = 10, accessToken?: string | null): Promise<AnalysisSummary[]> {
  const response = await authFetch(`/analyze/history?limit=${limit}`, { cache: "no-store" }, accessToken);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as AnalysisSummary[];
}

export async function fetchAnalysisById(id: string, accessToken?: string | null): Promise<AnalysisDetail> {
  const response = await authFetch(`/analyze/${id}`, { cache: "no-store" }, accessToken);
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

export function hasClientSession(): boolean {
  return Boolean(getClientAccessToken());
}
