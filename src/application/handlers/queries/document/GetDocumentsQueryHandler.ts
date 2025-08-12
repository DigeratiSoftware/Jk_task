import type { IQueryHandler } from "../../queries/interfaces/IQuery"
import type { GetDocumentsQuery, GetDocumentsQueryResult } from "../../queries/document/GetDocumentsQuery"
import type { IDocumentRepository } from "../../../domain/interfaces/repositories/IDocumentRepository"

export class GetDocumentsQueryHandler implements IQueryHandler<GetDocumentsQuery, GetDocumentsQueryResult> {
  constructor(private documentRepository: IDocumentRepository) {}

  async handle(query: GetDocumentsQuery): Promise<GetDocumentsQueryResult> {
    const result = await this.documentRepository.findAll(query.page, query.limit, query.userId)

    // Apply additional filtering
    let filteredDocuments = result.documents

    if (query.status) {
      filteredDocuments = filteredDocuments.filter((doc) => doc.status === query.status)
    }

    if (query.searchTerm) {
      const searchLower = query.searchTerm.toLowerCase()
      filteredDocuments = filteredDocuments.filter(
        (doc) => doc.title.toLowerCase().includes(searchLower) || doc.filename.toLowerCase().includes(searchLower),
      )
    }

    // Apply sorting
    filteredDocuments.sort((a, b) => {
      const aValue = this.getSortValue(a, query.sortBy)
      const bValue = this.getSortValue(b, query.sortBy)

      if (query.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return {
      data: {
        documents: filteredDocuments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: filteredDocuments.length,
          pages: Math.ceil(filteredDocuments.length / query.limit),
        },
      },
    }
  }

  private getSortValue(document: any, sortBy: string): any {
    switch (sortBy) {
      case "title":
        return document.title
      case "filename":
        return document.filename
      case "fileSize":
        return document.fileSize
      case "status":
        return document.status
      case "createdAt":
      default:
        return document.createdAt
    }
  }
}
