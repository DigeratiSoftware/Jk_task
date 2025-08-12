import { container } from "./DIContainer"
import { CommandBus } from "../../application/bus/CommandBus"
import { QueryBus } from "../../application/bus/QueryBus"

// Command Handlers
import { CreateUserCommandHandler } from "../../application/handlers/commands/user/CreateUserCommandHandler"
import { UpdateUserRoleCommandHandler } from "../../application/handlers/commands/user/UpdateUserRoleCommandHandler"
import { CreateDocumentCommandHandler } from "../../application/handlers/commands/document/CreateDocumentCommandHandler"
import { AskQuestionCommandHandler } from "../../application/handlers/commands/qa/AskQuestionCommandHandler"

// Query Handlers
import { GetUserQueryHandler } from "../../application/handlers/queries/user/GetUserQueryHandler"
import { GetUsersQueryHandler } from "../../application/handlers/queries/user/GetUsersQueryHandler"
import { GetDocumentQueryHandler } from "../../application/handlers/queries/document/GetDocumentQueryHandler"
import { GetDocumentsQueryHandler } from "../../application/handlers/queries/document/GetDocumentsQueryHandler"
import { GetDashboardStatsQueryHandler } from "../../application/handlers/queries/analytics/GetDashboardStatsQueryHandler"

// Commands
import { CreateUserCommand } from "../../application/commands/user/CreateUserCommand"
import { UpdateUserRoleCommand } from "../../application/commands/user/UpdateUserRoleCommand"
import { CreateDocumentCommand } from "../../application/commands/document/CreateDocumentCommand"
import { AskQuestionCommand } from "../../application/commands/qa/AskQuestionCommand"

// Queries
import { GetUserQuery } from "../../application/queries/user/GetUserQuery"
import { GetUsersQuery } from "../../application/queries/user/GetUsersQuery"
import { GetDocumentQuery } from "../../application/queries/document/GetDocumentQuery"
import { GetDocumentsQuery } from "../../application/queries/document/GetDocumentsQuery"
import { GetDashboardStatsQuery } from "../../application/queries/analytics/GetDashboardStatsQuery"

export function registerCQRSServices() {
  // Register buses
  const commandBus = new CommandBus()
  const queryBus = new QueryBus()

  container.registerInstance("CommandBus", commandBus)
  container.registerInstance("QueryBus", queryBus)

  // Register command handlers
  commandBus.register(
    CreateUserCommand,
    new CreateUserCommandHandler(container.resolve("UserRepository"), container.resolve("AuthService")),
  )

  commandBus.register(UpdateUserRoleCommand, new UpdateUserRoleCommandHandler(container.resolve("UserRepository")))

  commandBus.register(
    CreateDocumentCommand,
    new CreateDocumentCommandHandler(
      container.resolve("DocumentRepository"),
      container.resolve("DocumentProcessorFactory"),
    ),
  )

  commandBus.register(
    AskQuestionCommand,
    new AskQuestionCommandHandler(container.resolve("QASessionRepository"), container.resolve("RAGService")),
  )

  // Register query handlers
  queryBus.register(GetUserQuery, new GetUserQueryHandler(container.resolve("UserRepository")))

  queryBus.register(GetUsersQuery, new GetUsersQueryHandler(container.resolve("UserRepository")))

  queryBus.register(GetDocumentQuery, new GetDocumentQueryHandler(container.resolve("DocumentRepository")))

  queryBus.register(GetDocumentsQuery, new GetDocumentsQueryHandler(container.resolve("DocumentRepository")))

  queryBus.register(
    GetDashboardStatsQuery,
    new GetDashboardStatsQueryHandler(
      container.resolve("UserRepository"),
      container.resolve("DocumentRepository"),
      container.resolve("QASessionRepository"),
    ),
  )
}
