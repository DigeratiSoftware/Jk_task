import type { Request, Response } from "express"
import { container } from "../../infrastructure/config/DIContainer"
import type { CommandBus } from "../../application/bus/CommandBus"
import type { QueryBus } from "../../application/bus/QueryBus"
import { CreateUserCommand } from "../../application/commands/user/CreateUserCommand"
import { UpdateUserRoleCommand } from "../../application/commands/user/UpdateUserRoleCommand"
import { GetUserQuery } from "../../application/queries/user/GetUserQuery"
import { GetUsersQuery } from "../../application/queries/user/GetUsersQuery"
import { UserRole } from "../../domain/entities/User"
import { DomainException } from "../../domain/exceptions/DomainException"

export class CQRSUserController {
  private commandBus: CommandBus
  private queryBus: QueryBus

  constructor() {
    this.commandBus = container.resolve<CommandBus>("CommandBus")
    this.queryBus = container.resolve<QueryBus>("QueryBus")
  }

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body

      const command = new CreateUserCommand(email, password, firstName, lastName, role || UserRole.VIEWER)

      const result = await this.commandBus.execute(command)

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Registration failed",
          errors: result.errors,
        })
      }

      res.status(201).json({
        success: true,
        data: result.data,
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  login = async (req: Request, res: Response) => {
    try {
      // For login, we still use the auth service directly since it's not a typical command
      // In a more complex system, you might have a LoginCommand
      const authService = container.resolve("AuthService")
      const { email, password } = req.body

      const result = await authService.authenticate(email, password)
      if (!result) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

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
      const query = new GetUserQuery((req as any).user.id)
      const result = await this.queryBus.execute(query)

      res.json({
        success: true,
        data: result.data.toJSON(),
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getUsers = async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 10
      const role = req.query.role as UserRole
      const searchTerm = req.query.search as string

      const query = new GetUsersQuery(page, limit, role, searchTerm)
      const result = await this.queryBus.execute(query)

      res.json({
        success: true,
        data: {
          users: result.data.users.map((user) => user.toJSON()),
          pagination: result.data.pagination,
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
      const updatedBy = (req as any).user.id

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        })
      }

      const command = new UpdateUserRoleCommand(id, role, updatedBy)
      const result = await this.commandBus.execute(command)

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Failed to update user role",
          errors: result.errors,
        })
      }

      res.json({
        success: true,
        data: result.data,
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  private handleError(error: any, res: Response) {
    console.error("CQRSUserController error:", error)

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
