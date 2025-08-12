import type { DocumentChunk } from "../entities/Document"

export interface IRAGService {
  findRelevantChunks(
    question: string,
    documentIds?: string[],
    topK?: number,
  ): Promise<Array<{ chunk: DocumentChunk; similarity: number; documentTitle: string }>>

  generateAnswer(
    question: string,
    relevantChunks: Array<{ chunk: DocumentChunk; similarity: number; documentTitle: string }>,
  ): Promise<{ answer: string; confidence: number }>

  askQuestion(
    question: string,
    documentIds?: string[],
  ): Promise<{ answer: string; confidence: number; relevantDocuments: string[] }>
}
