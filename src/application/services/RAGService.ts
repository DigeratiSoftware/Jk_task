import type { IRAGService } from "../../domain/interfaces/services/IRAGService"
import type { IDocumentRepository } from "../../domain/interfaces/repositories/IDocumentRepository"
import type { IEmbeddingService } from "../../domain/interfaces/services/IEmbeddingService"
import type { DocumentChunk } from "../../domain/entities/Document"
import OpenAI from "openai"

export class RAGService implements IRAGService {
  private openai: OpenAI

  constructor(
    private documentRepository: IDocumentRepository,
    private embeddingService: IEmbeddingService,
    apiKey: string,
  ) {
    this.openai = new OpenAI({ apiKey })
  }

  async findRelevantChunks(
    question: string,
    documentIds?: string[],
    topK = 5,
  ): Promise<Array<{ chunk: DocumentChunk; similarity: number; documentTitle: string }>> {
    try {
      // Generate embedding for the question
      const questionEmbedding = await this.embeddingService.generateEmbedding(question)

      // Find processed documents
      const documents = await this.documentRepository.findProcessedDocuments(documentIds)

      const relevantChunks: Array<{ chunk: DocumentChunk; similarity: number; documentTitle: string }> = []

      // Calculate similarity for each chunk
      for (const doc of documents) {
        if (doc.chunks && doc.chunks.length > 0) {
          for (const chunk of doc.chunks) {
            if (chunk.embeddings && chunk.embeddings.length > 0) {
              const similarity = this.embeddingService.calculateSimilarity(questionEmbedding, chunk.embeddings)

              relevantChunks.push({
                chunk,
                similarity,
                documentTitle: doc.title,
              })
            }
          }
        }
      }

      // Sort by similarity and return top K
      return relevantChunks.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
    } catch (error) {
      console.error("Error finding relevant chunks:", error)
      return []
    }
  }

  async generateAnswer(
    question: string,
    relevantChunks: Array<{ chunk: DocumentChunk; similarity: number; documentTitle: string }>,
  ): Promise<{ answer: string; confidence: number }> {
    try {
      if (relevantChunks.length === 0) {
        return {
          answer:
            "I couldn't find relevant information to answer your question. Please try rephrasing or check if the documents contain the information you're looking for.",
          confidence: 0,
        }
      }

      // Prepare context from relevant chunks
      const context = relevantChunks
        .map((item, index) => `[${index + 1}] From "${item.documentTitle}": ${item.chunk.content}`)
        .join("\n\n")

      const prompt = `Based on the following context, please answer the question. If the context doesn't contain enough information to answer the question, please say so.

Context:
${context}

Question: ${question}

Answer:`

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that answers questions based on provided context. Always cite which document the information comes from when possible.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      })

      const answer = response.choices[0]?.message?.content || "Unable to generate answer."

      // Calculate confidence based on similarity scores
      const avgSimilarity = relevantChunks.reduce((sum, item) => sum + item.similarity, 0) / relevantChunks.length
      const confidence = Math.min(avgSimilarity * 2, 1) // Scale to 0-1

      return { answer, confidence }
    } catch (error) {
      console.error("Error generating answer:", error)
      return {
        answer: "Sorry, I encountered an error while generating the answer. Please try again.",
        confidence: 0,
      }
    }
  }

  async askQuestion(
    question: string,
    documentIds?: string[],
  ): Promise<{ answer: string; confidence: number; relevantDocuments: string[] }> {
    const relevantChunks = await this.findRelevantChunks(question, documentIds)
    const { answer, confidence } = await this.generateAnswer(question, relevantChunks)

    const relevantDocuments = [...new Set(relevantChunks.map((item) => item.chunk.metadata.documentId))]

    return { answer, confidence, relevantDocuments }
  }
}
