export interface User {
  _id?: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: "admin" | "editor" | "viewer"
  createdAt?: Date
  updatedAt?: Date
}

export interface Document {
  _id?: string
  title: string
  content: string
  filename: string
  fileType: string
  fileSize: number
  uploadedBy: string
  embeddings?: number[]
  chunks?: DocumentChunk[]
  ingestionStatus: "pending" | "processing" | "completed" | "failed"
  createdAt?: Date
  updatedAt?: Date
}

export interface DocumentChunk {
  id: string
  content: string
  embeddings: number[]
  metadata: {
    chunkIndex: number
    documentId: string
    startIndex: number
    endIndex: number
  }
}

export interface QASession {
  _id?: string
  userId: string
  question: string
  answer: string
  relevantDocuments: string[]
  confidence: number
  createdAt?: Date
}

export interface IngestionJob {
  _id?: string
  documentId: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  error?: string
  startedAt?: Date
  completedAt?: Date
}

export interface AuthResponse {
  token: string
  user: Omit<User, "password">
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
