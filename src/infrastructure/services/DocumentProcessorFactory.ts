import type { IDocumentProcessor } from "../../domain/interfaces/services/IDocumentProcessor"

export class TextDocumentProcessor implements IDocumentProcessor {
  canProcess(fileType: string): boolean {
    return ["text/plain", "text/markdown"].includes(fileType)
  }

  async extractText(buffer: Buffer, filename: string): Promise<string> {
    return buffer.toString("utf-8")
  }

  async process(document: any): Promise<void> {
    // Text documents are already processed during extraction
    return Promise.resolve()
  }
}

export class PDFDocumentProcessor implements IDocumentProcessor {
  canProcess(fileType: string): boolean {
    return fileType === "application/pdf"
  }

  async extractText(buffer: Buffer, filename: string): Promise<string> {
    // In a real implementation, you would use a PDF parsing library like pdf-parse
    // For now, we'll return a placeholder
    return `[PDF Content from ${filename}] - This would contain the extracted text from the PDF`
  }

  async process(document: any): Promise<void> {
    // Additional PDF-specific processing could go here
    return Promise.resolve()
  }
}

export class WordDocumentProcessor implements IDocumentProcessor {
  canProcess(fileType: string): boolean {
    return ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
      fileType,
    )
  }

  async extractText(buffer: Buffer, filename: string): Promise<string> {
    // In a real implementation, you would use a library like mammoth.js
    return `[Word Document Content from ${filename}] - This would contain the extracted text from the Word document`
  }

  async process(document: any): Promise<void> {
    // Additional Word document-specific processing could go here
    return Promise.resolve()
  }
}

export class DocumentProcessorFactory {
  private processors: IDocumentProcessor[] = [
    new TextDocumentProcessor(),
    new PDFDocumentProcessor(),
    new WordDocumentProcessor(),
  ]

  getProcessor(fileType: string): IDocumentProcessor | null {
    return this.processors.find((processor) => processor.canProcess(fileType)) || null
  }

  getSupportedFileTypes(): string[] {
    return this.processors.reduce((types, processor) => {
      // This is a simplified approach - in reality, you'd have a method to get supported types
      return types
    }, [] as string[])
  }
}
