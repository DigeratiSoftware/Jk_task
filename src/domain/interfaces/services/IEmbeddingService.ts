export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>
  generateEmbeddings(texts: string[]): Promise<number[][]>
  calculateSimilarity(embedding1: number[], embedding2: number[]): number
  chunkText(text: string, chunkSize?: number, overlap?: number): string[]
}
