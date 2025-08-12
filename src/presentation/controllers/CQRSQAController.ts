import type { Request, Response } from "express"
import { container } from "../../infrastructure/config/DIContainer"
import type { CommandBus } from "../../application/bus/CommandBus"
import type { QueryBus } from "../../application/bus/QueryBus"
import { AskQuestionCommand } from "../../application/commands/qa/AskQuestionCommand"
import { GetQAHistoryQuery } from "../../application/queries/qa/GetQAHistoryQuery"
import { GetQASessionQuery } from "../../application/queries/qa/GetQASessionQuery"
import { DomainException } from "../../domain/exceptions/DomainException"

export class CQRSQAController {
  private commandBus: CommandBus
  private queryBus: QueryBus

  constructor() {
    this.commandBus = container.resolve<CommandBus>("CommandBus")
    this.queryBus = container.resolve<QueryBus>("QueryBus")
  }

  askQuestion = async (req: Request, res: Response) => {
    try {
      const { question, documentIds } = req.body
      const user = (req as any).user

      const command = new AskQuestionCommand(user.id, question, documentIds)
      const result = await this.commandBus.execute(command)

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Failed to process question",
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

  getHistory = async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20
      const searchTerm = req.query.search as string
      const confidenceThreshold = req.query.confidence ? Number.parseFloat(req.query.confidence as string) : undefined
      const user = (req as any).user

      const query = new GetQAHistoryQuery(user.id, page, limit, searchTerm, confidenceThreshold)
      const result = await this.queryBus.execute(query)

      res.json({
        success: true,
        data: {
          sessions: result.data.sessions.map((session) => session.toJSON()),
          pagination: result.data.pagination,
        },
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user = (req as any).user

      const query = new GetQASessionQuery(id, user.id)
      const result = await this.queryBus.execute(query)

      // Check permissions
      if (user.role !== "admin" && result.data.userId !== user.id) {
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

  private handleError(error: any, res: Response) {
    console.error("CQRSQAController error:", error)

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
