import axios from "axios"
import type { AuthResponse, ApiResponse, User, Document, QASession, IngestionJob } from "../types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authApi = {
  register: (userData: Partial<User>) => api.post<ApiResponse<AuthResponse>>("/auth/register", userData),

  login: (email: string, password: string) => api.post<ApiResponse<AuthResponse>>("/auth/login", { email, password }),

  logout: () => api.post<ApiResponse>("/auth/logout"),

  getCurrentUser: () => api.get<ApiResponse<User>>("/auth/me"),
}

// Users API
export const usersApi = {
  getUsers: (page = 1, limit = 10) =>
    api.get<ApiResponse<{ users: User[]; pagination: any }>>(`/users?page=${page}&limit=${limit}`),

  getUserById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),

  updateUserRole: (id: string, role: string) => api.patch<ApiResponse<User>>(`/users/${id}/role`, { role }),

  deleteUser: (id: string) => api.delete<ApiResponse>(`/users/${id}`),
}

// Documents API
export const documentsApi = {
  getDocuments: (page = 1, limit = 10) =>
    api.get<ApiResponse<{ documents: Document[]; pagination: any }>>(`/documents?page=${page}&limit=${limit}`),

  getDocumentById: (id: string) => api.get<ApiResponse<Document>>(`/documents/${id}`),

  uploadDocument: (formData: FormData) =>
    api.post<ApiResponse<Document>>("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateDocument: (id: string, data: Partial<Document>) => api.patch<ApiResponse<Document>>(`/documents/${id}`, data),

  deleteDocument: (id: string) => api.delete<ApiResponse>(`/documents/${id}`),

  triggerIngestion: (id: string) => api.post<ApiResponse>(`/documents/${id}/ingest`),
}

// Q&A API
export const qaApi = {
  askQuestion: (question: string, documentIds?: string[]) =>
    api.post<
      ApiResponse<{
        question: string
        answer: string
        confidence: number
        relevantDocuments: string[]
        sessionId: string
      }>
    >("/qa/ask", { question, documentIds }),

  getHistory: (page = 1, limit = 20) =>
    api.get<ApiResponse<{ sessions: QASession[]; pagination: any }>>(`/qa/history?page=${page}&limit=${limit}`),

  getSession: (id: string) => api.get<ApiResponse<QASession>>(`/qa/session/${id}`),
}

// Ingestion API
export const ingestionApi = {
  getStatus: (documentId: string) =>
    api.get<ApiResponse<{ documentStatus: string; job: IngestionJob | null }>>(`/ingestion/status/${documentId}`),

  getAllJobs: (limit = 50) => api.get<ApiResponse<IngestionJob[]>>(`/ingestion/jobs?limit=${limit}`),
}

export default api
