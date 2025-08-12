export interface DocumentReadModel {
  id: string
  title: string
  filename: string
  fileType: string
  fileSize: number
  status: string
  uploadedBy: {
    id: string
    fullName: string
    email: string
  }
  processingProgress: number
  chunkCount: number
  createdAt: Date
  updatedAt: Date
  lastAccessedAt?: Date
}

export interface DocumentStatsReadModel {
  totalDocuments: number
  documentsByStatus: Record<string, number>
  documentsByType: Record<string, number>
  totalStorageUsed: number
  averageProcessingTime: number
  mostAccessedDocuments: Array<{
    id: string
    title: string
    accessCount: number
  }>
}
