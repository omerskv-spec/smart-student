export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  grade: string | null;
  track: string | null;
  subjects: string[] | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ClassroomCache {
  user_id: string;
  data: ClassroomData | null;
  updated_at: string;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
}

export interface ClassroomAssignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  state: string;
  alternateLink?: string;
}

export interface ClassroomData {
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  lastUpdated: string;
  summary: string;
}

export interface StudentFile {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  content?: string;
  size_bytes: number;
  conversation_id?: string;
  created_at: string;
}

export interface ApiError {
  error: string;
  details?: string | object;
  code?: string;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
  agentUsed: string;
  agentLabel: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  size: number;
  preview: string | null;
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
}
