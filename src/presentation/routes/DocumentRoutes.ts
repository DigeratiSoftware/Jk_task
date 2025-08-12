import { Router } from "express"
import { DocumentController } from "../controllers/DocumentController"
import { AuthMiddleware } from "../middleware/AuthMiddleware"
import { UserRole } from "../../domain/entities/User"

export class DocumentRoutes {
  private router: Router
  private documentController: DocumentController
  private authMiddleware: AuthMiddleware

  constructor() {
    this.router = Router()
    this.documentController = new DocumentController()
    this.authMiddleware = new AuthMiddleware()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // All routes require authentication
    this.router.use(this.authMiddleware.authenticate)

    // Get documents (all users)
    this.router.get("/", this.documentController.getDocuments)
    this.router.get("/:id", this.documentController.getDocument)

    // Upload and modify documents (editor and admin only)
    this.router.post(
      "/upload",
      this.authMiddleware.authorize(UserRole.EDITOR, UserRole.ADMIN),
      this.documentController.getUploadMiddleware(),
      this.documentController.uploadDocument,
    )

    this.router.patch(
      "/:id",
      this.authMiddleware.authorize(UserRole.EDITOR, UserRole.ADMIN),
      this.documentController.updateDocument,
    )

    this.router.delete(
      "/:id",
      this.authMiddleware.authorize(UserRole.EDITOR, UserRole.ADMIN),
      this.documentController.deleteDocument,
    )

    this.router.post(
      "/:id/ingest",
      this.authMiddleware.authorize(UserRole.EDITOR, UserRole.ADMIN),
      this.documentController.triggerIngestion,
    )
  }

  getRouter(): Router {
    return this.router
  }
}
