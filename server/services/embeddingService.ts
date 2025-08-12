import OpenAI from "openai"

class EmbeddingService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "your-openai-api-key",
    })
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
      // Fallback: return a mock embedding for demo purposes
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

  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

    return dotProduct / (magnitudeA * magnitudeB)
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

export default new EmbeddingService()
