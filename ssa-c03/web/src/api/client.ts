import {
  ExamSession,
  Paginated,
  Preferences,
  Question,
  Stats,
  User,
  UserNote,
  UserState,
} from './types';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

function url(path: string) {
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url(path), {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  }
  return data as T;
}

export const api = {
  getMe: () => request<{ user: User; stats: Stats }>('/me'),
  updatePreferences: (patch: Partial<Preferences>) =>
    request<{ user: User }>('/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  listQuestions: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<Paginated<Question>>(`/questions?${qs.toString()}`);
  },

  getQuestion: (number: number, include = 'state,note') =>
    request<Question>(`/questions/${number}?include=${include}`),

  getNote: (number: number) => request<UserNote>(`/notes/${number}`),
  saveNote: (number: number, body: string) =>
    request<UserNote>(`/notes/${number}`, {
      method: 'PUT',
      body: JSON.stringify({ body }),
    }),
  listNotes: (page = 1) => request<Paginated<UserNote>>(`/notes?page=${page}&limit=50`),

  getProgress: (number: number) => request<UserState>(`/progress/${number}`),
  patchProgress: (number: number, patch: Partial<UserState>) =>
    request<UserState>(`/progress/${number}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  resetProgress: (number: number) =>
    request<UserState>(`/progress/${number}/reset`, { method: 'POST' }),
  resetAllProgress: () =>
    request<{ matched: number; modified: number }>('/progress/reset-all', {
      method: 'POST',
    }),

  createSession: (body: {
    mode: 'practice' | 'study' | 'exam';
    count?: number;
    questionNumbers?: number[];
  }) =>
    request<ExamSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getSession: (id: string, number?: number) => {
    const qs = number ? `?number=${number}` : '';
    return request<{ session: ExamSession; question: Question | null }>(
      `/sessions/${id}${qs}`,
    );
  },

  answerSession: (id: string, number: number, selected: string[]) =>
    request<{
      number: number;
      selected: string[];
      graded: boolean;
      correct?: boolean;
      correctAnswers?: string[];
      summaryNote?: string;
      options?: Question['options'];
      status?: string;
      score?: ExamSession['score'];
    }>(`/sessions/${id}/answer`, {
      method: 'PATCH',
      body: JSON.stringify({ number, selected }),
    }),

  revealSession: (id: string, number: number) =>
    request<{
      number: number;
      correctAnswers: string[];
      summaryNote: string;
      options: Question['options'];
    }>(`/sessions/${id}/reveal`, {
      method: 'POST',
      body: JSON.stringify({ number }),
    }),

  finishSession: (id: string) =>
    request<ExamSession>(`/sessions/${id}/finish`, { method: 'POST' }),
};
