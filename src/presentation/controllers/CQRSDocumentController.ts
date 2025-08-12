import type { Request, Response } from "express"
import multer from "multer"
import { container } from "../../infrastructure/config/DIContainer"
import type { CommandBus } from "../../application/bus/CommandBus"
import type { QueryBus } from "../../application/bus/QueryBus"
import { CreateDocumentCommand } from "../../application/commands/document/CreateDocumentCommand"
import { GetDocumentQuery } from "../../application/queries/document/GetDocumentQuery"
import { GetDocumentsQuery } from "../../application/queries/document/GetDocumentsQuery"
import type { DocumentStatus } from "../../domain/entities/Document"
import { DomainException } from "../../domain/exceptions/DomainException"

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

export class CQRSDocumentController {
  private commandBus: CommandBus
  private queryBus: QueryBus

  constructor() {
    this.commandBus = container.resolve<CommandBus>("CommandBus")
    this.queryBus = container.resolve<QueryBus>("QueryBus")
  }

  getUploadMiddleware() {
    return upload.single("file")
  }

  getDocuments = async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 10
      const userId = (req as any).user.role !== "admin" ? (req as any).user.id : undefined
      const status = req.query.status as DocumentStatus
      const searchTerm = req.query.search as string
      const sortBy = (req.query.sortBy as string) || "createdAt"
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc"

      const query = new GetDocumentsQuery(page, limit, userId, status, searchTerm, sortBy, sortOrder)
      const result = await this.queryBus.execute(query)

      res.json({
        success: true,
        data: {
          documents: result.data.documents.map((doc) => doc.toJSON()),
          pagination: result.data.pagination,
        },
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const requestedBy = (req as any).user.id

      const query = new GetDocumentQuery(id, requestedBy, true)
      const result = await this.queryBus.execute(query)

      // Check permissions
      const user = (req as any).user
      if (user.role !== "admin" && result.data.uploadedBy !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      res.json({
        success: true,
        data: result.data.toJSON(),
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  uploadDocument = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        })
      }

      const { title } = req.body
      const user = (req as any).user

      const command = new CreateDocumentCommand(
        title || req.file.originalname,
        "", // Content will be extracted by the handler
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        user.id,
        req.file.buffer,
      )

      const result = await this.commandBus.execute(command)

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Failed to upload document",
          errors: result.errors,
        })
      }

      // Start processing asynchronously (this could be a separate command)
      const documentService = container.resolve("DocumentService")
      documentService.processDocument(result.data!.documentId).catch((error: any) => {
        console.error("Document processing error:", error)
      })

      res.status(201).json({
        success: true,
        data: result.data,
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  private handleError(error: any, res: Response) {
    console.error("CQRSDocumentController error:", error)

    if (error instanceof DomainException) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}
