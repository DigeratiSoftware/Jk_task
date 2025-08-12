import mongoose, { Schema, type Document as MongoDocument } from "mongoose"
import type { QASession } from "../../types"

interface QASessionDocument extends Omit<QASession, "_id">, MongoDocument {}

const qaSessionSchema = new Schema<QASessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    relevantDocuments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

qaSessionSchema.index({ userId: 1 })
qaSessionSchema.index({ createdAt: -1 })

export default mongoose.model<QASessionDocument>("QASession", qaSessionSchema)
