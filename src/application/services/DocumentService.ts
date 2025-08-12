import type { IDocumentRepository } from "../../domain/interfaces/repositories/IDocumentRepository"
import type { IEmbeddingService } from "../../domain/interfaces/services/IEmbeddingService"
import { Document, DocumentStatus, DocumentChunk, ChunkMetadata } from "../../domain/entities/Document"
import type { DocumentProcessorFactory } from "../../infrastructure/services/DocumentProcessorFactory"
import { DocumentNotFoundException, DocumentProcessingException } from "../../domain/exceptions/DomainException"

export class DocumentService {
  constructor(
    private documentRepository: IDocumentRepository,
    private embeddingService: IEmbeddingService,
    private processorFactory: DocumentProcessorFactory,
  ) {}

  async createDocument(
    title: string,
    buffer: Buffer,
    filename: string,
    fileType: string,
    fileSize: number,
    uploadedBy: string,
  ): Promise<Document> {
    const processor = this.processorFactory.getProcessor(fileType)
    if (!processor) {
      throw new DocumentProcessingException(`Unsupported file type: ${fileType}`)
    }

    const content = await processor.extractText(buffer, filename)

    const document = new Document(title, content, filename, fileType, fileSize, uploadedBy)

    return await this.documentRepository.create(document)
  }

  async getDocument(id: string): Promise<Document> {
    const document = await this.documentRepository.findById(id)
    if (!document) {
      throw new DocumentNotFoundException(id)
    }
    return document
  }

  async getDocuments(page: number, limit: number, userId?: string): Promise<{ documents: Document[]; total: number }> {
    return await this.documentRepository.findAll(page, limit, userId)
  }

  async updateDocument(id: string, updates: { title?: string; content?: string }): Promise<Document> {
    const document = await this.getDocument(id)

    if (updates.title) {
      document.updateTitle(updates.title)
    }

    if (updates.content) {
      document.updateContent(updates.content)
    }

    const updatedDocument = await this.documentRepository.update(id, document)
    if (!updatedDocument) {
      throw new DocumentNotFoundException(id)
    }

    return updatedDocument
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.getDocument(id)
    const deleted = await this.documentRepository.delete(id)

    if (!deleted) {
      throw new DocumentProcessingException("Failed to delete document")
    }
  }

  async processDocument(id: string): Promise<void> {
    const document = await this.getDocument(id)

    if (!document.canBeProcessed()) {
      throw new DocumentProcessingException("Document cannot be processed in its current state")
    }

    try {
      document.updateStatus(DocumentStatus.PROCESSING)
      await this.documentRepository.update(id, document)

      // Chunk the document content
      const chunks = this.embeddingService.chunkText(document.content, 1000, 200)

      // Generate embeddings for chunks
      const embeddings = await this.embeddingService.generateEmbeddings(chunks)

      // Create document chunks
      const documentChunks: DocumentChunk[] = chunks.map(
        (chunk, index) =>
          new DocumentChunk(
            `${id}_chunk_${index}`,
            chunk,
            embeddings[index],
            new ChunkMetadata(
              index,
              id,
              index * 800, // Approximate start index
              Math.min(index * 800 + chunk.length, document.content.length),
            ),
          ),
      )

      // Generate document-level embedding (average of chunk embeddings)
      const documentEmbedding = this.averageEmbeddings(embeddings)

      document.setEmbeddings(documentEmbedding)
      document.setChunks(documentChunks)
      document.updateStatus(DocumentStatus.COMPLETED)

      await this.documentRepository.update(id, document)
    } catch (error) {
      document.updateStatus(DocumentStatus.FAILED)
      await this.documentRepository.update(id, document)
      throw new DocumentProcessingException(`Failed to process document: ${error}`)
    }
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
}
