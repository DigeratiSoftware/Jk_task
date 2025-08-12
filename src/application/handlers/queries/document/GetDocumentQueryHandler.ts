import type { IQueryHandler } from "../../queries/interfaces/IQuery"
import type { GetDocumentQuery, GetDocumentQueryResult } from "../../queries/document/GetDocumentQuery"
import type { IDocumentRepository } from "../../../domain/interfaces/repositories/IDocumentRepository"
import { DocumentNotFoundException } from "../../../domain/exceptions/DomainException"

export class GetDocumentQueryHandler implements IQueryHandler<GetDocumentQuery, GetDocumentQueryResult> {
  constructor(private documentRepository: IDocumentRepository) {}

  async handle(query: GetDocumentQuery): Promise<GetDocumentQueryResult> {
    const document = await this.documentRepository.findById(query.documentId)
    if (!document) {
      throw new DocumentNotFoundException(query.documentId)
    }

    // If content is not requested, we could create a lighter version
    // This is where read models would be beneficial in a full CQRS implementation

    return {
      data: document,
    }
  }
}
