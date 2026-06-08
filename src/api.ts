const API_BASE = "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `خطأ ${res.status}`);
  }
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse<{ user: any; token: string }>(res);
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  });
  return handleResponse<T>(res);
}

// Users
export const getUsers = () => fetchApi<any[]>("/api/users");
export const createUser = (data: any) =>
  fetchApi<any>("/api/users", { method: "POST", body: JSON.stringify(data) });
export const updateUser = (id: number, data: any) =>
  fetchApi<any>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteUser = (id: number) =>
  fetchApi<any>(`/api/users/${id}`, { method: "DELETE" });

// Questions
export const getQuestions = () => fetchApi<any[]>("/api/questions");
export const createQuestion = (data: any) =>
  fetchApi<any>("/api/questions", { method: "POST", body: JSON.stringify(data) });
export const updateQuestion = (id: number, data: any) =>
  fetchApi<any>(`/api/questions/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteQuestion = (id: number) =>
  fetchApi<any>(`/api/questions/${id}`, { method: "DELETE" });

// Templates
export const getTemplates = () => fetchApi<any[]>("/api/templates");

// Surveys
export const submitSurvey = (data: any) =>
  fetchApi<any>("/api/surveys", { method: "POST", body: JSON.stringify(data) });
export const getSurveysArchive = (params: Record<string, string>) => {
  const qs = new URLSearchParams(params).toString();
  return fetchApi<{ surveys: any[]; pagination: any }>(`/api/surveys/archive?${qs}`);
};
export const getSurvey = (id: number) => fetchApi<any>(`/api/surveys/${id}`);
export const updateSurvey = (id: number, data: any) =>
  fetchApi<any>(`/api/surveys/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteSurvey = (id: number) =>
  fetchApi<any>(`/api/surveys/${id}`, { method: "DELETE" });
export const updateFollowup = (id: number, data: any) =>
  fetchApi<any>(`/api/surveys/${id}/followup`, { method: "POST", body: JSON.stringify(data) });

// Analytics
export const getAnalytics = (params?: Record<string, string>) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return fetchApi<any>(`/api/analytics${qs}`);
};

// Categories
export const getCategories = () => fetchApi<any[]>("/api/categories");
export const createCategory = (data: any) =>
  fetchApi<any>("/api/categories", { method: "POST", body: JSON.stringify(data) });
export const updateCategory = (id: number, data: any) =>
  fetchApi<any>(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCategory = (id: number) =>
  fetchApi<any>(`/api/categories/${id}`, { method: "DELETE" });

// WhatsApp
export const getWhatsAppLogs = () => fetchApi<any[]>("/api/whatsapp/logs");
export const simulateWebhook = (logId: string, status: string) =>
  fetchApi<any>("/api/whatsapp/simulate-webhook", {
    method: "POST",
    body: JSON.stringify({ logId, status }),
  });
