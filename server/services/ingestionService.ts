import Document from "../models/Document"
import IngestionJob from "../models/IngestionJob"
import embeddingService from "./embeddingService"
import type { DocumentChunk } from "../../types"

class IngestionService {
  async processDocument(documentId: string): Promise<void> {
    let job

    try {
      // Create ingestion job
      job = new IngestionJob({
        documentId,
        status: "processing",
        startedAt: new Date(),
      })
      await job.save()

      // Update document status
      await Document.findByIdAndUpdate(documentId, {
        ingestionStatus: "processing",
      })

      // Get document
      const document = await Document.findById(documentId)
      if (!document) {
        throw new Error("Document not found")
      }

      // Update progress
      await this.updateProgress(job._id.toString(), 20)

      // Chunk the document content
      const chunks = embeddingService.chunkText(document.content, 1000, 200)

      // Update progress
      await this.updateProgress(job._id.toString(), 40)

      // Generate embeddings for chunks
      const embeddings = await embeddingService.generateEmbeddings(chunks)

      // Update progress
      await this.updateProgress(job._id.toString(), 70)

      // Create document chunks
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: `${documentId}_chunk_${index}`,
        content: chunk,
        embeddings: embeddings[index],
        metadata: {
          chunkIndex: index,
          documentId: documentId,
          startIndex: index * 800, // Approximate start index
          endIndex: Math.min(index * 800 + chunk.length, document.content.length),
        },
      }))

      // Generate document-level embedding (average of chunk embeddings)
      const documentEmbedding = this.averageEmbeddings(embeddings)

      // Update document with embeddings and chunks
      await Document.findByIdAndUpdate(documentId, {
        embeddings: documentEmbedding,
        chunks: documentChunks,
        ingestionStatus: "completed",
      })

      // Update job status
      await IngestionJob.findByIdAndUpdate(job._id, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      })
    } catch (error) {
      console.error("Error processing document:", error)

      // Update document status
      await Document.findByIdAndUpdate(documentId, {
        ingestionStatus: "failed",
      })

      // Update job status
      if (job) {
        await IngestionJob.findByIdAndUpdate(job._id, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
      }
    }
  }

  private async updateProgress(jobId: string, progress: number): Promise<void> {
    await IngestionJob.findByIdAndUpdate(jobId, { progress })
  }

  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return []

    const dimension = embeddings[0].length
    const averaged = new Array(dimension).fill(0)

    for (const embedding of embeddings) {
      for (let i = 0; i < dimension; i++) {
        averaged[i] += embedding[i]
      }
    }

    return averaged.map((val) => val / embeddings.length)
  }

  async getIngestionStatus(documentId: string) {
    const job = await IngestionJob.findOne({ documentId }).sort({ createdAt: -1 })
    const document = await Document.findById(documentId).select("ingestionStatus")

    return {
      documentStatus: document?.ingestionStatus || "pending",
      job: job || null,
    }
  }

  async getAllIngestionJobs(limit = 50) {
    return IngestionJob.find().populate("documentId", "title filename").sort({ createdAt: -1 }).limit(limit)
  }
}

export default new IngestionService()
