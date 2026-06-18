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
  avatarURL?: string | null;
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
  language?: string | null;
  bio?: string | null;
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

export interface NextVideo {
  answer: string;
  id_video: string;
  url: string;
  vtt_url?: string;
  ada_similarity_score: number;
}

// VideoJSON.index renders this shape (no playback URL, no questions/streams).
export interface VideoListItem {
  id_video: string;
  idx: number;
  private: boolean;
  answer: string;
  language: string;
  likes: number;
  views: number;
  duration_seconds: number;
  toia_id: number;
}

export interface VideoQuestion {
  id_question: number;
  question: string;
  priority: number;
  onboarding: boolean;
  suggested_type: string;
  trigger_suggester: boolean;
}

export interface VideoStreamRef {
  id_stream: number;
  name: string;
  private: boolean;
  likes: number;
  views: number;
  toia_id: number;
}

// VideoJSON.videoWithInfo adds the playback URL plus linked questions & streams.
export interface VideoDetail extends VideoListItem {
  videoURL: string;
  questions: VideoQuestion[];
  streams: VideoStreamRef[];
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

  // Ask the dialogue manager for the best matching recorded answer.
  nextVideo: (streamId: number | string, question: string, language = "en-US") =>
    http
      .post<NextVideo>(
        `/stream/${streamId}/next?question=${encodeURIComponent(question)}`,
        { params: { language } },
      )
      .then((r) => r.data),

  // Returns a filler video URL as plain text.
  getFiller: (streamId: number | string) =>
    http.get(`/stream/${streamId}/filler`, { responseType: "text" }).then((r) => r.data as string),

  // Rate a played answer (rating: 1 = helpful, -1 = not helpful).
  saveFeedback: (payload: { video_id: string; question: string; rating: number }) =>
    http.post("/player_feedback", payload).then((r) => r.data),

  // List the signed-in user's recorded videos (VideoJSON.index, bare array).
  listVideos: () => http.get<VideoListItem[]>("/video").then((r) => r.data),

  // Full detail for one video: playback URL + linked questions & streams.
  getVideo: (id: string) =>
    http.get<VideoDetail>(`/video/${id}`).then((r) => r.data),

  // Upload a recorded video. `form` must include the blob under "video".
  createVideo: (form: FormData) =>
    http.post<{ videoID: string }>("/video", form).then((r) => r.data),

  // Re-record / edit an existing video. The backend deletes the old video and
  // creates a replacement, so `form` carries the same fields as createVideo
  // (including a fresh "video" blob). Returns the new video's id.
  updateVideo: (id: string, form: FormData) =>
    http.patch<{ videoID: string }>(`/video/${id}`, form).then((r) => r.data),

  // Remove a single question→video link (VideoQuestionStreamController.delete).
  deleteVideoQuestion: (videoId: string, questionId: number) =>
    http
      .delete<{ removedEntries: number }>("/video_question_stream", {
        params: { video_id: videoId, question_id: questionId },
      })
      .then((r) => r.data),

  // Create a stream. `form` must include name, private, and a stream_pic file.
  // Returns the user's full stream list.
  createStream: (form: FormData) =>
    http.post<Stream[]>("/stream", form).then((r) => r.data),

  // Edit an existing stream's name / privacy / language / bio (owner only).
  updateStream: (
    id: number | string,
    changes: { name?: string; private?: boolean; language?: string; bio?: string },
  ) => http.patch<Stream>(`/stream/${id}`, { stream: changes }).then((r) => r.data),

  // Current user's profile (ToiaUserJSON wraps it in { data }).
  getProfile: () =>
    http.get<{ data: AuthUser }>("/toia_user").then((r) => r.data.data),

  // Update the current user's settings. `form` may include first_name,
  // last_name, language, and an optional "avatar" image file.
  updateProfile: (form: FormData) =>
    http.patch<{ data: AuthUser }>("/toia_user/profile", form).then((r) => r.data.data),
};

