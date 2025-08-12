import type { Request, Response } from "express"
import multer from "multer"
import { container } from "../../infrastructure/config/DIContainer"
import type { DocumentService } from "../../application/services/DocumentService"
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

export class DocumentController {
  private documentService: DocumentService

  constructor() {
    this.documentService = container.resolve<DocumentService>("DocumentService")
  }

  getUploadMiddleware() {
    return upload.single("file")
  }

  getDocuments = async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 10
      const userId = (req as any).user.role !== "admin" ? (req as any).user.id : undefined

      const result = await this.documentService.getDocuments(page, limit, userId)

      res.json({
        success: true,
        data: {
          documents: result.documents.map((doc) => doc.toJSON()),
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
        },
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const document = await this.documentService.getDocument(id)

      // Check permissions
      const user = (req as any).user
      if (user.role !== "admin" && document.uploadedBy !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      res.json({
        success: true,
        data: document.toJSON(),
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

      const document = await this.documentService.createDocument(
        title || req.file.originalname,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        user.id,
      )

      // Start processing asynchronously
      this.documentService.processDocument(document.id!).catch((error) => {
        console.error("Document processing error:", error)
      })

      res.status(201).json({
        success: true,
        data: document.toJSON(),
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  updateDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { title, content } = req.body
      const user = (req as any).user

      // Check permissions
      const document = await this.documentService.getDocument(id)
      if (user.role !== "admin" && document.uploadedBy !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      const updatedDocument = await this.documentService.updateDocument(id, { title, content })

      // If content was updated, restart processing
      if (content) {
        this.documentService.processDocument(id).catch((error) => {
          console.error("Document processing error:", error)
        })
      }

      res.json({
        success: true,
        data: updatedDocument.toJSON(),
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  deleteDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user = (req as any).user

      // Check permissions
      const document = await this.documentService.getDocument(id)
      if (user.role !== "admin" && document.uploadedBy !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      await this.documentService.deleteDocument(id)

      res.json({
        success: true,
        message: "Document deleted successfully",
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  triggerIngestion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user = (req as any).user

      // Check permissions
      const document = await this.documentService.getDocument(id)
      if (user.role !== "admin" && document.uploadedBy !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      // Start processing
      this.documentService.processDocument(id).catch((error) => {
        console.error("Document processing error:", error)
      })

      res.json({
        success: true,
        message: "Ingestion started",
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  private handleError(error: any, res: Response) {
    console.error("DocumentController error:", error)

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
