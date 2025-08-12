import mongoose, { Schema, type Document as MongoDocument } from "mongoose"
import type { Document as DocType, DocumentChunk } from "../../types"

interface DocumentDocument extends Omit<DocType, "_id">, MongoDocument {}

const documentChunkSchema = new Schema<DocumentChunk>({
  id: { type: String, required: true },
  content: { type: String, required: true },
  embeddings: [{ type: Number }],
  metadata: {
    chunkIndex: { type: Number, required: true },
    documentId: { type: String, required: true },
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
  },
})

const documentSchema = new Schema<DocumentDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    embeddings: [{ type: Number }],
    chunks: [documentChunkSchema],
    ingestionStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
)

// Index for vector similarity search
documentSchema.index({ embeddings: 1 })
documentSchema.index({ "chunks.embeddings": 1 })
documentSchema.index({ uploadedBy: 1 })
documentSchema.index({ ingestionStatus: 1 })

export default mongoose.model<DocumentDocument>("Document", documentSchema)
