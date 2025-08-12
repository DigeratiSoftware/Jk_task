import type { Document } from "../entities/Document"

export interface IDocumentProcessor {
  canProcess(fileType: string): boolean
  extractText(buffer: Buffer, filename: string): Promise<string>
  process(document: Document): Promise<void>
}
