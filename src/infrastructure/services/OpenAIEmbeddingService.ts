import OpenAI from "openai"
import type { IEmbeddingService } from "../../domain/interfaces/services/IEmbeddingService"

export class OpenAIEmbeddingService implements IEmbeddingService {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      })

      return response.data[0].embedding
    } catch (error) {
      console.error("Error generating embedding:", error)
      // Fallback: return mock embedding for demo purposes
      return Array.from({ length: 1536 }, () => Math.random() - 0.5)
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      })

      return response.data.map((item) => item.embedding)
    } catch (error) {
      console.error("Error generating embeddings:", error)
      // Fallback: return mock embeddings for demo purposes
      return texts.map(() => Array.from({ length: 1536 }, () => Math.random() - 0.5))
    }
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0)
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0))
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0))

    return dotProduct / (magnitude1 * magnitude2)
  }

  chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.slice(start, end))

      if (end === text.length) break
      start = end - overlap
    }

    return chunks
  }
}
