import type { Request, Response } from "express"
import { container } from "../../infrastructure/config/DIContainer"
import type { UserService } from "../../application/services/UserService"
import { UserRole } from "../../domain/entities/User"
import { DomainException } from "../../domain/exceptions/DomainException"

export class UserController {
  private userService: UserService

  constructor() {
    this.userService = container.resolve<UserService>("UserService")
  }

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body

      const result = await this.userService.createUser({
        email,
        password,
        firstName,
        lastName,
        role: role || UserRole.VIEWER,
      })

      res.status(201).json({
        success: true,
        data: {
          token: result.token,
          user: result.user.toJSON(),
        },
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      const result = await this.userService.authenticateUser(email, password)

      res.json({
        success: true,
        data: {
          token: result.token,
          user: result.user.toJSON(),
        },
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.getUser((req as any).user.id)

      res.json({
        success: true,
        data: user.toJSON(),
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getUsers = async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 10

      const result = await this.userService.getUsers(page, limit)

      res.json({
        success: true,
        data: {
          users: result.users.map((user) => user.toJSON()),
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

  updateUserRole = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { role } = req.body

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        })
      }

      const user = await this.userService.updateUserRole(id, role)

      res.json({
        success: true,
        data: user.toJSON(),
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      await this.userService.deleteUser(id)

      res.json({
        success: true,
        message: "User deleted successfully",
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  private handleError(error: any, res: Response) {
    console.error("UserController error:", error)

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
