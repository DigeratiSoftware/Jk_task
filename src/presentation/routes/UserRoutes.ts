import { Router } from "express"
import { UserController } from "../controllers/UserController"
import { AuthMiddleware } from "../middleware/AuthMiddleware"
import { UserRole } from "../../domain/entities/User"

export class UserRoutes {
  private router: Router
  private userController: UserController
  private authMiddleware: AuthMiddleware

  constructor() {
    this.router = Router()
    this.userController = new UserController()
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

    this.router.delete(
      "/:id",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(UserRole.ADMIN),
      this.userController.deleteUser,
    )
  }

  getRouter(): Router {
    return this.router
  }
}
