import { BaseEntity } from "./User"

export enum DocumentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export class DocumentChunk {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly embeddings: number[],
    public readonly metadata: ChunkMetadata,
  ) {}
}

export class ChunkMetadata {
  constructor(
    public readonly chunkIndex: number,
    public readonly documentId: string,
    public readonly startIndex: number,
    public readonly endIndex: number,
  ) {}
}

export class Document extends BaseEntity {
  private _title: string
  private _content: string
  private _filename: string
  private _fileType: string
  private _fileSize: number
  private _uploadedBy: string
  private _embeddings?: number[]
  private _chunks?: DocumentChunk[]
  private _status: DocumentStatus

  constructor(
    title: string,
    content: string,
    filename: string,
    fileType: string,
    fileSize: number,
    uploadedBy: string,
    id?: string,
    embeddings?: number[],
    chunks?: DocumentChunk[],
    status: DocumentStatus = DocumentStatus.PENDING,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt)
    this._title = title
    this._content = content
    this._filename = filename
    this._fileType = fileType
    this._fileSize = fileSize
    this._uploadedBy = uploadedBy
    this._embeddings = embeddings
    this._chunks = chunks
    this._status = status
  }

  get title(): string {
    return this._title
  }

  get content(): string {
    return this._content
  }

  get filename(): string {
    return this._filename
  }

  get fileType(): string {
    return this._fileType
  }

  get fileSize(): number {
    return this._fileSize
  }

  get uploadedBy(): string {
    return this._uploadedBy
  }

  get embeddings(): number[] | undefined {
    return this._embeddings
  }

  get chunks(): DocumentChunk[] | undefined {
    return this._chunks
  }

  get status(): DocumentStatus {
    return this._status
  }

  updateTitle(title: string): void {
    this._title = title
  }

  updateContent(content: string): void {
    this._content = content
    this._status = DocumentStatus.PENDING // Reset status when content changes
  }

  setEmbeddings(embeddings: number[]): void {
    this._embeddings = embeddings
  }

  setChunks(chunks: DocumentChunk[]): void {
    this._chunks = chunks
  }

  updateStatus(status: DocumentStatus): void {
    this._status = status
  }

  isProcessed(): boolean {
    return this._status === DocumentStatus.COMPLETED
  }

  canBeProcessed(): boolean {
    return this._status === DocumentStatus.PENDING || this._status === DocumentStatus.FAILED
  }

  toJSON(): any {
    return {
      id: this._id,
      title: this._title,
      filename: this._filename,
      fileType: this._fileType,
      fileSize: this._fileSize,
      uploadedBy: this._uploadedBy,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
