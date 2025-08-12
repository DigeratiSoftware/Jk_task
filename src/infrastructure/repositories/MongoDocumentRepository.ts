import mongoose, { Schema, type Document as MongoDocument } from "mongoose"
import type { IDocumentRepository } from "../../domain/interfaces/repositories/IDocumentRepository"
import { Document, DocumentStatus, DocumentChunk, ChunkMetadata } from "../../domain/entities/Document"

interface DocumentDocument extends MongoDocument {
  title: string
  content: string
  filename: string
  fileType: string
  fileSize: number
  uploadedBy: mongoose.Types.ObjectId
  embeddings?: number[]
  chunks?: any[]
  status: DocumentStatus
}

const chunkMetadataSchema = new Schema<ChunkMetadata>({
  chunkIndex: { type: Number, required: true },
  documentId: { type: String, required: true },
  startIndex: { type: Number, required: true },
  endIndex: { type: Number, required: true },
})

const documentChunkSchema = new Schema<DocumentChunk>({
  id: { type: String, required: true },
  content: { type: String, required: true },
  embeddings: [{ type: Number }],
  metadata: chunkMetadataSchema,
})

const documentSchema = new Schema<DocumentDocument>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    embeddings: [{ type: Number }],
    chunks: [documentChunkSchema],
    status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.PENDING },
  },
  { timestamps: true },
)

// Indexes for performance
documentSchema.index({ embeddings: 1 })
documentSchema.index({ "chunks.embeddings": 1 })
documentSchema.index({ uploadedBy: 1 })
documentSchema.index({ status: 1 })

const DocumentModel = mongoose.model<DocumentDocument>("Document", documentSchema)

export class MongoDocumentRepository implements IDocumentRepository {
  async findById(id: string): Promise<Document | null> {
    const docDoc = await DocumentModel.findById(id).populate("uploadedBy", "firstName lastName email")
    return docDoc ? this.toDomainEntity(docDoc) : null
  }

  async findAll(page: number, limit: number, userId?: string): Promise<{ documents: Document[]; total: number }> {
    const skip = (page - 1) * limit
    const query = userId ? { uploadedBy: userId } : {}

    const [docDocs, total] = await Promise.all([
      DocumentModel.find(query)
        .populate("uploadedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DocumentModel.countDocuments(query),
    ])

    return {
      documents: docDocs.map((doc) => this.toDomainEntity(doc)),
      total,
    }
  }

  async findByStatus(status: DocumentStatus): Promise<Document[]> {
    const docDocs = await DocumentModel.find({ status })
    return docDocs.map((doc) => this.toDomainEntity(doc))
  }

  async findByUserId(userId: string): Promise<Document[]> {
    const docDocs = await DocumentModel.find({ uploadedBy: userId })
    return docDocs.map((doc) => this.toDomainEntity(doc))
  }

  async create(document: Document): Promise<Document> {
    const docDoc = new DocumentModel({
      title: document.title,
      content: document.content,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize,
      uploadedBy: document.uploadedBy,
      status: document.status,
    })

    const savedDoc = await docDoc.save()
    return this.toDomainEntity(savedDoc)
  }

  async update(id: string, updates: Partial<Document>): Promise<Document | null> {
    const docDoc = await DocumentModel.findByIdAndUpdate(id, updates, { new: true }).populate(
      "uploadedBy",
      "firstName lastName email",
    )
    return docDoc ? this.toDomainEntity(docDoc) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await DocumentModel.findByIdAndDelete(id)
    return !!result
  }

  async count(): Promise<number> {
    return DocumentModel.countDocuments()
  }

  async findProcessedDocuments(documentIds?: string[]): Promise<Document[]> {
    const query: any = { status: DocumentStatus.COMPLETED }
    if (documentIds && documentIds.length > 0) {
      query._id = { $in: documentIds }
    }

    const docDocs = await DocumentModel.find(query)
    return docDocs.map((doc) => this.toDomainEntity(doc))
  }

  private toDomainEntity(docDoc: DocumentDocument): Document {
    const chunks = docDoc.chunks?.map(
      (chunk) =>
        new DocumentChunk(
          chunk.id,
          chunk.content,
          chunk.embeddings,
          new ChunkMetadata(
            chunk.metadata.chunkIndex,
            chunk.metadata.documentId,
            chunk.metadata.startIndex,
            chunk.metadata.endIndex,
          ),
        ),
    )

    return new Document(
      docDoc.title,
      docDoc.content,
      docDoc.filename,
      docDoc.fileType,
      docDoc.fileSize,
      docDoc.uploadedBy.toString(),
      docDoc._id.toString(),
      docDoc.embeddings,
      chunks,
      docDoc.status,
      docDoc.createdAt,
      docDoc.updatedAt,
    )
  }
}
