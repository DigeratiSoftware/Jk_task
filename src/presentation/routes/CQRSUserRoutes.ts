import { Router } from "express"
import { CQRSUserController } from "../controllers/CQRSUserController"
import { AuthMiddleware } from "../middleware/AuthMiddleware"
import { UserRole } from "../../domain/entities/User"

export class CQRSUserRoutes {
  private router: Router
  private userController: CQRSUserController
  private authMiddleware: AuthMiddleware

  constructor() {
    this.router = Router()
    this.userController = new CQRSUserController()
    this.authMiddleware = new AuthMiddleware()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // Public routes
    this.router.post("/register", this.userController.register)
    this.router.post("/login", this.userController.login)

    // Protected routes
    this.router.get("/me", this.authMiddleware.authenticate, this.userController.getCurrentUser)

    // Admin only routes
    this.router.get(
      "/",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(UserRole.ADMIN),
      this.userController.getUsers,
    )

    this.router.patch(
      "/:id/role",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(UserRole.ADMIN),
      this.userController.updateUserRole,
    )
  }

  getRouter(): Router {
    return this.router
  }
}
