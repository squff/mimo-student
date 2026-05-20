// API base - empty string uses Next.js rewrites to proxy to backend
const API_BASE = '';

// ─── Helpers ─────────────────────────────────────────────

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '请求失败');
  }
  return res.json();
}

// ─── Chat (SSE Streaming) ────────────────────────────────

export async function* sendChat(
  message: string,
  module: string = 'general',
  history: { role: string; content: string }[] = []
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, module, history }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '对话请求失败');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) yield parsed.content;
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

// ─── Vision ──────────────────────────────────────────────

export async function visionAnalyze(
  file: File,
  prompt: string = '',
  module: string = 'general'
): Promise<{ response: string; image: string; module: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('prompt', prompt);
  formData.append('module', module);

  const res = await fetch(`${API_BASE}/api/vision`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '图像识别失败');
  }

  return res.json();
}

// ─── Homework CRUD ───────────────────────────────────────

export interface Homework {
  id: number;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  created_at: string;
}

export async function getHomework(): Promise<{ items: Homework[] }> {
  return fetcher('/api/homework');
}

export async function createHomework(data: {
  subject: string;
  title: string;
  description?: string;
  deadline?: string;
}): Promise<{ status: string }> {
  return fetcher('/api/homework', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHomework(id: number, status: string): Promise<{ status: string }> {
  const formData = new FormData();
  formData.append('status', status);
  const res = await fetch(`${API_BASE}/api/homework/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) throw new Error('更新失败');
  return res.json();
}

export async function deleteHomework(id: number): Promise<void> {
  await fetcher(`/api/homework/${id}`, { method: 'DELETE' });
}

// ─── Schedule CRUD ───────────────────────────────────────

export interface ScheduleItem {
  id: number;
  course_name: string;
  teacher: string;
  classroom: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
}

export async function getSchedule(): Promise<{ items: ScheduleItem[] }> {
  return fetcher('/api/schedule');
}

export async function createSchedule(data: {
  course_name: string;
  teacher?: string;
  classroom?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color?: string;
}): Promise<{ status: string }> {
  return fetcher('/api/schedule', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSchedule(id: number): Promise<void> {
  await fetcher(`/api/schedule/${id}`, { method: 'DELETE' });
}

export async function scheduleOCR(file: File): Promise<{ response: string; courses: any[]; image: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/api/schedule/ocr`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '课程表识别失败');
  }

  return res.json();
}

// ─── Diet ────────────────────────────────────────────────

export interface DietRecord {
  id: number;
  meal_type: string;
  foods: string;
  calories: number;
  image_path: string;
  created_at: string;
}

export async function analyzeDiet(
  file: File,
  meal_type: string = '午餐'
): Promise<{ response: string; image: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('meal_type', meal_type);

  const res = await fetch(`${API_BASE}/api/diet/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '饮食分析失败');
  }

  return res.json();
}

export async function getDiet(days: number = 7): Promise<{ items: DietRecord[] }> {
  return fetcher(`/api/diet?days=${days}`);
}

export async function getDietStats(days: number = 7): Promise<{ items: { day: string; total: number }[] }> {
  return fetcher(`/api/diet/stats?days=${days}`);
}

// ─── Exam ────────────────────────────────────────────────

export interface ExamCard {
  id: number;
  subject: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: number;
  mastered: number;
  created_at: string;
}

export async function generateExam(
  subject: string,
  count: number = 5
): Promise<{ response: string; cards: any[] }> {
  const formData = new FormData();
  formData.append('subject', subject);
  formData.append('count', String(count));

  const res = await fetch(`${API_BASE}/api/exam/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '生成题目失败');
  }

  return res.json();
}

export async function getExamCards(subject?: string, mastered?: number): Promise<{ items: ExamCard[] }> {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (mastered !== undefined) params.set('mastered', String(mastered));
  const query = params.toString() ? `?${params}` : '';
  return fetcher(`/api/exam/cards${query}`);
}

export async function markMastered(id: number, mastered: number = 1): Promise<{ status: string }> {
  return fetcher(`/api/exam/cards/${id}/master?mastered=${mastered}`, {
    method: 'PUT',
  });
}

// ─── Stats ───────────────────────────────────────────────

export interface DashboardStats {
  interactions: number;
  homework: number;
  schedule: number;
  diet_records: number;
  exam_cards: number;
  today_interactions: number;
  unmastered_cards: number;
}

export async function getStats(): Promise<DashboardStats> {
  return fetcher('/api/stats');
}

// ─── Generic Helpers (used by pages) ─────────────────────

export async function apiGet<T>(url: string): Promise<T> {
  return fetcher<T>(url);
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
  return fetcher<T>(url, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
    headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' },
  });
}

export async function apiDelete<T>(url: string): Promise<T> {
  return fetcher<T>(url, { method: 'DELETE' });
}

export async function apiPatch<T>(url: string, data?: any): Promise<T> {
  return fetcher<T>(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '上传失败');
  }
  return res.json();
}

export async function* fetchSSE(
  url: string,
  data: any
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || '请求失败');
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const d = line.slice(6);
        if (d === '[DONE]') return;
        try {
          const parsed = JSON.parse(d);
          if (parsed.content) yield parsed.content;
        } catch {}
      }
    }
  }
}
