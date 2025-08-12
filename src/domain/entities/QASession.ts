import { BaseEntity } from "./User"

export class QASession extends BaseEntity {
  private _userId: string
  private _question: string
  private _answer: string
  private _relevantDocuments: string[]
  private _confidence: number

  constructor(
    userId: string,
    question: string,
    answer: string,
    relevantDocuments: string[] = [],
    confidence = 0,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt)
    this._userId = userId
    this._question = question
    this._answer = answer
    this._relevantDocuments = relevantDocuments
    this._confidence = Math.max(0, Math.min(1, confidence)) // Ensure 0-1 range
  }

  get userId(): string {
    return this._userId
  }

  get question(): string {
    return this._question
  }

  get answer(): string {
    return this._answer
  }

  get relevantDocuments(): string[] {
    return [...this._relevantDocuments] // Return copy to maintain immutability
  }

  get confidence(): number {
    return this._confidence
  }

  get confidencePercentage(): number {
    return Math.round(this._confidence * 100)
  }

  isHighConfidence(): boolean {
    return this._confidence >= 0.8
  }

  isMediumConfidence(): boolean {
    return this._confidence >= 0.6 && this._confidence < 0.8
  }

  isLowConfidence(): boolean {
    return this._confidence < 0.6
  }

  toJSON(): any {
    return {
      id: this._id,
      userId: this._userId,
      question: this._question,
      answer: this._answer,
      relevantDocuments: this._relevantDocuments,
      confidence: this._confidence,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
