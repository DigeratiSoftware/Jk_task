import type { Request, Response, NextFunction } from "express"
import { container } from "../../infrastructure/config/DIContainer"
import type { IAuthService } from "../../domain/interfaces/services/IAuthService"
import { UnauthorizedException, ForbiddenException } from "../../domain/exceptions/DomainException"
import type { UserRole } from "../../domain/entities/User"

interface AuthRequest extends Request {
  user?: any
}

export class AuthMiddleware {
  private authService: IAuthService

  constructor() {
    this.authService = container.resolve<IAuthService>("AuthService")
  }

  authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "")

      if (!token) {
        throw new UnauthorizedException("Access denied. No token provided.")
      }

      const user = await this.authService.verifyToken(token)
      if (!user) {
        throw new UnauthorizedException("Invalid token.")
      }

      req.user = user
      next()
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      }

      res.status(401).json({
        success: false,
        message: "Authentication failed",
      })
    }
  }

  authorize = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Access denied.",
        })
      }

      if (!roles.some((role) => req.user.hasRole(role))) {
        const error = new ForbiddenException()
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      }

      next()
    }
  }

  requirePermission = (permission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Access denied.",
        })
      }

      if (!req.user.hasPermission(permission)) {
        const error = new ForbiddenException(`Permission required: ${permission}`)
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      }

      next()
    }
  }
}
