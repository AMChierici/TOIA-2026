import axios from "axios";
import { getToken } from "./token";

// Single origin in prod (Phoenix serves the SPA); the Vite dev server proxies
// /api and /media to the Phoenix backend (see vite.config.ts).
export const http = axios.create({ baseURL: "/api" });

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
}

export interface AuthResponse {
  token: string;
  data: AuthUser;
}

export interface Stream {
  id_stream: number;
  name: string;
  private: boolean;
  likes: number;
  views: number;
  toia_id: number;
  videos_count?: number;
  pic?: string | null;
}

export interface UserStats {
  totalVideosCount: number;
  totalStreamCounts: number;
  totalVideoDuration: number;
}

export interface QuestionSuggestion {
  id_question: number;
  question: string;
  type: string;
  priority: number;
  isPending?: boolean;
  onboarding?: boolean;
  trigger_suggester?: boolean;
}

export const api = {
  login: (email: string, password: string) =>
    http.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),

  signup: (form: FormData) =>
    http.post<AuthResponse>("/auth/toia_user", form).then((r) => r.data),

  // StreamJSON.index renders a bare array.
  listStreams: () => http.get<Stream[]>("/stream").then((r) => r.data),

  listUserStreams: (userId: number | string) =>
    http.get<Stream[]>(`/toia_user/${userId}/streams`).then((r) => r.data),

  // ToiaUserJSON wraps single resources in { data }.
  getStats: () =>
    http.get<{ data: UserStats }>("/toia_user/stats").then((r) => r.data.data),

  // QuestionSuggestionJSON.index renders a bare array.
  listSuggestions: () =>
    http.get<QuestionSuggestion[]>("/question_suggestions").then((r) => r.data),
};

