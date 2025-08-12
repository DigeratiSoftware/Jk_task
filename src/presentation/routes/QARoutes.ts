import { Router } from "express"
import { QAController } from "../controllers/QAController"
import { AuthMiddleware } from "../middleware/AuthMiddleware"

export class QARoutes {
  private router: Router
  private qaController: QAController
  private authMiddleware: AuthMiddleware

  constructor() {
    this.router = Router()
    this.qaController = new QAController()
    this.authMiddleware = new AuthMiddleware()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // All routes require authentication
    this.router.use(this.authMiddleware.authenticate)

    this.router.post("/ask", this.qaController.askQuestion)
    this.router.get("/history", this.qaController.getHistory)
    this.router.get("/session/:id", this.qaController.getSession)
  }

  getRouter(): Router {
    return this.router
  }
}
