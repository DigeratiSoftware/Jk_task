import type { Document, DocumentStatus } from "../entities/Document"

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>
  findAll(page: number, limit: number, userId?: string): Promise<{ documents: Document[]; total: number }>
  findByStatus(status: DocumentStatus): Promise<Document[]>
  findByUserId(userId: string): Promise<Document[]>
  create(document: Document): Promise<Document>
  update(id: string, updates: Partial<Document>): Promise<Document | null>
  delete(id: string): Promise<boolean>
  count(): Promise<number>
  findProcessedDocuments(documentIds?: string[]): Promise<Document[]>
}
