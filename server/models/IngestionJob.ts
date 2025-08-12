import mongoose, { Schema, type Document as MongoDocument } from "mongoose"
import type { IngestionJob } from "../../types"

interface IngestionJobDocument extends Omit<IngestionJob, "_id">, MongoDocument {}

const ingestionJobSchema = new Schema<IngestionJobDocument>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    error: {
      type: String,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

ingestionJobSchema.index({ documentId: 1 })
ingestionJobSchema.index({ status: 1 })

export default mongoose.model<IngestionJobDocument>("IngestionJob", ingestionJobSchema)
