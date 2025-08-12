import type { ICommandHandler } from "../../commands/interfaces/ICommand"
import type { CreateDocumentCommand, CreateDocumentCommandResult } from "../../commands/document/CreateDocumentCommand"
import type { IDocumentRepository } from "../../../domain/interfaces/repositories/IDocumentRepository"
import type { DocumentProcessorFactory } from "../../../infrastructure/services/DocumentProcessorFactory"
import { Document } from "../../../domain/entities/Document"

export class CreateDocumentCommandHandler
  implements ICommandHandler<CreateDocumentCommand, CreateDocumentCommandResult>
{
  constructor(
    private documentRepository: IDocumentRepository,
    private processorFactory: DocumentProcessorFactory,
  ) {}

  async handle(command: CreateDocumentCommand): Promise<CreateDocumentCommandResult> {
    try {
      const processor = this.processorFactory.getProcessor(command.fileType)
      if (!processor) {
        return {
          success: false,
          errors: [`Unsupported file type: ${command.fileType}`],
        }
      }

      const content = await processor.extractText(command.fileBuffer, command.filename)

      const document = new Document(
        command.title,
        content,
        command.filename,
        command.fileType,
        command.fileSize,
        command.uploadedBy,
      )

      const savedDocument = await this.documentRepository.create(document)

      return {
        success: true,
        data: {
          documentId: savedDocument.id!,
          title: savedDocument.title,
          status: savedDocument.status,
        },
      }
    } catch (error) {
      console.error("CreateDocumentCommandHandler error:", error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      }
    }
  }
}
